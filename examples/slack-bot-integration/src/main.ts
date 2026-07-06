/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Slack bot integration acceptance demo. The module wires a small
 * adapter that converts inbound Slack `event_callback` payloads into
 * Graphorin agent runs, streams the assistant reply back to Slack via
 * `chat.postMessage`, and exercises the durable HITL approval lifecycle
 * end-to-end. The smoke test stubs the real `@slack/web-api` client and
 * the LLM provider, so CI never touches the network.
 *
 * Headline scenarios:
 *
 *   - {@link processSlackEvent} - the synchronous fast-path for
 *     non-approval messages: validate the Slack signature, push the
 *     message into the session, stream the agent reply, mirror it back
 *     to Slack.
 *   - {@link simulateApprovalLifecycle} - the durable HITL story: a
 *     high-amount expense suspends the agent on
 *     `tool.approval.requested`; the example posts an "approval needed"
 *     Slack message; the SQLite-backed `CheckpointStore` survives a
 *     simulated `pkill graphorin && restart` boundary; an operator
 *     button click resumes the run via
 *     `agent.run(savedState, { directive: { approvals: [...] } })`.
 *
 * The `if (import.meta.url === ...)` block at the bottom prints a one-
 * line summary so `pnpm dev` stays useful as a quick local sanity check.
 */

import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import process from 'node:process';
import { type Agent, createAgent } from '@graphorin/agent';
import type { AgentEvent, Provider, RunState, SessionScope, ToolApproval } from '@graphorin/core';
import { optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createMemory, type Memory } from '@graphorin/memory';
import { createProvider } from '@graphorin/provider';
import {
  type CreateServerOptions,
  createServer,
  type GraphorinServer,
  type ServerAgentLike,
} from '@graphorin/server';
import { createSessionManager, type Session, type SessionManager } from '@graphorin/sessions';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };
import { createSubmitExpenseTool, DEFAULT_APPROVAL_THRESHOLD_USD } from './expense-tool.js';
import {
  createInMemorySlackClient,
  type InMemorySlackClient,
  type RecordedSlackMessage,
  type SlackClient,
} from './slack-stub.js';
import { createStubProvider } from './stub-provider.js';

export const VERSION: string = pkg.version;

/** Recipe selector. Only `'stub'` ships in v0.1 - production deployments swap providers. */
export type Recipe = 'stub';

const ALL_RECIPES: ReadonlyArray<Recipe> = ['stub'];

const DEFAULT_USER_ID = 'slack-operator';
const DEFAULT_AGENT_ID = 'slack-bot';
const DEFAULT_SESSION_TITLE = 'Slack bridge';
const DEFAULT_CHANNEL = 'C-default';
const SLACK_ROUTING_NS = 'agent';

/** Bookkeeping table the example owns directly. Idempotent (`IF NOT EXISTS`). */
const SLACK_ROUTING_DDL = `
CREATE TABLE IF NOT EXISTS slack_pending_approvals (
  run_id        TEXT PRIMARY KEY,
  tool_call_id  TEXT NOT NULL,
  channel       TEXT NOT NULL,
  thread_ts     TEXT,
  expense_json  TEXT NOT NULL,
  recorded_at   INTEGER NOT NULL
);
`;

/** Slack outer envelope mirrored from the public `events_api` contract. */
export interface SlackEventEnvelope {
  readonly type: 'event_callback' | 'url_verification';
  readonly token?: string;
  readonly challenge?: string;
  readonly team_id?: string;
  readonly api_app_id?: string;
  readonly event?: SlackInnerEvent;
  readonly event_id?: string;
  readonly event_time?: number;
}

/** Inner Slack `message` event the bridge consumes. */
export interface SlackInnerEvent {
  readonly type: 'message' | 'app_mention';
  readonly user?: string;
  readonly text: string;
  readonly channel: string;
  readonly ts: string;
  readonly thread_ts?: string;
}

/** Inputs accepted by {@link createSlackBotApp}. */
export interface CreateSlackBotAppOptions {
  readonly recipe?: Recipe;
  readonly dbPath?: string;
  readonly slackClient?: SlackClient;
  readonly providerOverride?: Provider;
  readonly userId?: string;
  readonly agentId?: string;
  readonly sessionId?: string;
  readonly defaultChannel?: string;
  readonly approvalThresholdUsd?: number;
  /**
   * Inject a pre-built SQLite store. Tests use this to share the same
   * backing connection across the simulated server-restart boundary.
   */
  readonly store?: GraphorinSqliteStore;
  readonly env?: NodeJS.ProcessEnv;
  /** Slack signing secret for inbound-webhook signature validation. */
  readonly signingSecret?: string;
  /**
   * Override the deterministic ref factory the `submit_expense` tool
   * uses. Tests inject a counter so smoke assertions are stable.
   */
  readonly newExpenseRef?: () => string;
  /**
   * Override the `userId` carried with each Slack-originated turn. Used
   * by the smoke test to distinguish the bridge from CLI traffic.
   */
  readonly slackUserId?: string;
  /** Server-config overrides forwarded to {@link createServer}. */
  readonly server?: ServerOverrides;
}

/** Selected server-config overrides exposed to callers. */
export interface ServerOverrides {
  readonly auth?: {
    readonly enabled?: boolean;
    /** Env-var name the server resolves the pepper from. Defaults to `GRAPHORIN_SLACK_BOT_PEPPER`. */
    readonly pepperEnvVar?: string;
  };
}

/** Pending-approval record surfaced by {@link SlackBotApp.listPendingApprovals}. */
export interface PendingApprovalRecord {
  readonly runId: string;
  readonly toolCallId: string;
  readonly channel: string;
  readonly threadTs?: string;
  readonly expense: SubmittedExpense;
  readonly recordedAt: string;
}

/** Inputs the slack adapter forwards to the agent. */
export interface SubmittedExpense {
  readonly amount: number;
  readonly justification: string;
}

/** Inputs accepted by {@link SlackBotApp.handleSlackApproval}. */
export interface HandleSlackApprovalInput {
  readonly runId: string;
  readonly decision: 'approve' | 'deny';
  readonly reason?: string;
}

/** Result of {@link SlackBotApp.processSlackEvent}. */
export interface ProcessSlackEventResult {
  readonly status: 'ok' | 'challenge' | 'awaiting_approval' | 'rejected';
  readonly reason?: string;
  readonly runId?: string;
  readonly assistantText?: string;
  readonly slackMessageTs?: string;
  readonly challenge?: string;
}

/** Result of {@link SlackBotApp.handleSlackApproval}. */
export interface HandleSlackApprovalResult {
  readonly status: 'completed' | 'still_pending' | 'denied' | 'unknown_run';
  readonly assistantText?: string;
  readonly slackMessageTs?: string;
  readonly runId: string;
}

/** Public handle exposed by {@link createSlackBotApp}. */
export interface SlackBotApp {
  readonly store: GraphorinSqliteStore;
  readonly memory: Memory;
  readonly sessions: SessionManager;
  readonly session: Session;
  readonly agent: Agent<undefined, string>;
  readonly server: GraphorinServer;
  readonly slackClient: SlackClient;
  readonly slackBridge: SlackBridge;
  readonly recipe: Recipe;
  readonly userId: string;
  readonly agentId: string;
  readonly sessionId: string;
  readonly scope: SessionScope;
  readonly defaultChannel: string;
  readonly approvalThresholdUsd: number;
  /** Process a single Slack event end-to-end. */
  processSlackEvent(input: ProcessSlackEventInput): Promise<ProcessSlackEventResult>;
  /** Resolve a pending approval (button click → resume the agent). */
  handleSlackApproval(input: HandleSlackApprovalInput): Promise<HandleSlackApprovalResult>;
  /** Snapshot of every pending approval the bridge is currently tracking. */
  listPendingApprovals(): Promise<ReadonlyArray<PendingApprovalRecord>>;
  close(): Promise<void>;
}

/** Inputs accepted by {@link SlackBotApp.processSlackEvent}. */
export interface ProcessSlackEventInput {
  readonly event: SlackEventEnvelope;
  /** Raw Slack request body - required when verifying the signature. */
  readonly rawBody?: string;
  readonly headers?: Readonly<Record<string, string | undefined>>;
  /** Skip the signature check (used by tests + library-mode callers). */
  readonly skipSignatureCheck?: boolean;
}

/** Slack signature primitives + REST forwarder owned by the bridge layer. */
export interface SlackBridge {
  /**
   * Validate a Slack request signature per the public `events_api`
   * contract: `v0={hex(HMAC_SHA256(signing_secret, "v0:" + ts + ":" + body))}`.
   */
  verifySignature(input: VerifySignatureInput): VerifySignatureResult;
}

/** Inputs accepted by {@link SlackBridge.verifySignature}. */
export interface VerifySignatureInput {
  readonly rawBody: string;
  readonly timestamp: string;
  readonly signature: string;
  /** Drift tolerance in seconds. Defaults to 300 (Slack's published bound). */
  readonly toleranceSeconds?: number;
  readonly now?: () => number;
}

/** Result of {@link SlackBridge.verifySignature}. */
export type VerifySignatureResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'no-secret' | 'stale' | 'malformed' | 'mismatch' };

/** Resolve the configured recipe. Defaults to `'stub'`. */
export function resolveRecipe(env: NodeJS.ProcessEnv = process.env): Recipe {
  const raw = (env.GRAPHORIN_LLM_RECIPE ?? 'stub').trim().toLowerCase();
  if ((ALL_RECIPES as ReadonlyArray<string>).includes(raw)) return raw as Recipe;
  throw new TypeError(
    `[graphorin/example-slack-bot-integration] Unknown GRAPHORIN_LLM_RECIPE='${raw}'. ` +
      `Pick one of ${ALL_RECIPES.join(', ')}.`,
  );
}

/** Build the `Provider` for the chosen recipe. */
export function buildProvider(recipe: Recipe): Provider {
  if (recipe === 'stub') {
    return createProvider(createStubProvider(), {
      acceptsSensitivity: ['public', 'internal', 'secret'],
    });
  }
  throw new TypeError(
    `[graphorin/example-slack-bot-integration] No provider builder for recipe='${recipe}'.`,
  );
}

/**
 * Build the Slack-bot example handle. The server is created but inert;
 * call {@link startSlackBotApp} (or `app.server.start()`) to bind the
 * HTTP listener. Library-mode callers can drive
 * {@link SlackBotApp.processSlackEvent} directly without the listener.
 */
export async function createSlackBotApp(
  options: CreateSlackBotAppOptions = {},
): Promise<SlackBotApp> {
  const env = options.env ?? process.env;
  const recipe = options.recipe ?? resolveRecipe(env);
  const userId = options.userId ?? (env.GRAPHORIN_USER_ID ?? DEFAULT_USER_ID).trim();
  const agentId = options.agentId ?? DEFAULT_AGENT_ID;
  const sessionId =
    options.sessionId ?? (env.GRAPHORIN_SESSION_ID ?? `slack_${Date.now().toString(36)}`).trim();
  const dbPath = options.dbPath ?? env.GRAPHORIN_DB_PATH ?? ':memory:';
  const defaultChannel =
    options.defaultChannel ?? (env.GRAPHORIN_SLACK_DEFAULT_CHANNEL ?? DEFAULT_CHANNEL).trim();
  const approvalThresholdUsd = options.approvalThresholdUsd ?? DEFAULT_APPROVAL_THRESHOLD_USD;
  const slackUserId = options.slackUserId ?? (env.GRAPHORIN_SLACK_USER_ID ?? userId).trim();
  const signingSecret = options.signingSecret ?? env.GRAPHORIN_SLACK_SIGNING_SECRET;
  const slackClient = options.slackClient ?? createInMemorySlackClient();

  const store =
    options.store ??
    (await createSqliteStore({
      path: dbPath,
      ...(dbPath === ':memory:' ? { disableWalHardening: true } : {}),
      skipSqliteVec: true,
    }));
  await store.init();
  store.connection.exec(SLACK_ROUTING_DDL);

  const provider = options.providerOverride ?? buildProvider(recipe);
  const scope: SessionScope = { userId, sessionId, agentId };

  const memory: Memory = createMemory({
    store: store.memory,
    embeddings: store.embeddings,
    resolveScope: () => scope,
  });

  const sessions: SessionManager = createSessionManager({
    store: store.sessions,
    memory: memory.session,
  });

  await sessions.agents.register(agentId, { displayName: 'Slack Bridge Bot' });
  const existingSession = await sessions.find(sessionId);
  const session =
    existingSession ??
    (await sessions.create({
      sessionId,
      userId,
      agentId,
      title: DEFAULT_SESSION_TITLE,
    }));

  const expenseTool = createSubmitExpenseTool({
    approvalThresholdUsd,
    ...(options.newExpenseRef !== undefined ? { newRef: options.newExpenseRef } : {}),
  });

  const tracer = optionalTracerFromEnv(env);
  const agent = createAgent<undefined, string>({
    name: agentId,
    instructions:
      'You are graphorin, a Slack-bridge agent. Mirror conversations from Slack to the ' +
      'Graphorin runtime. Use the `submit_expense` tool when the operator asks you to file ' +
      'an expense; the framework will pause the run for approval when amounts exceed the ' +
      'configured threshold.',
    provider,
    // W-100: `AgentConfig.tools` accepts `AnyTool<TDeps>` - a
    // strongly-typed tool slots in without a cast.
    tools: [expenseTool],
    memory,
    sessionId,
    userId,
    checkpointStore: store.checkpoints,
    ...(tracer !== undefined ? { tracer } : {}),
  });

  const server = await buildServer({
    store,
    agent,
    agentId,
    ...(options.server !== undefined ? { serverOverrides: options.server } : {}),
    env,
  });

  const bridge: SlackBridge = {
    verifySignature(input) {
      return verifySlackSignatureSync({
        rawBody: input.rawBody,
        timestamp: input.timestamp,
        signature: input.signature,
        signingSecret,
        ...(input.toleranceSeconds !== undefined
          ? { toleranceSeconds: input.toleranceSeconds }
          : {}),
        ...(input.now !== undefined ? { now: input.now } : {}),
      });
    },
  };

  let closed = false;
  const handle: SlackBotApp = {
    store,
    memory,
    sessions,
    session,
    agent,
    server,
    slackClient,
    slackBridge: bridge,
    recipe,
    userId,
    agentId,
    sessionId,
    scope,
    defaultChannel,
    approvalThresholdUsd,
    async processSlackEvent(input) {
      return processSlackEventInternal({
        app: handle,
        ...input,
        slackUserId,
        ...(signingSecret !== undefined ? { signingSecret } : {}),
      });
    },
    async handleSlackApproval(input) {
      return handleSlackApprovalInternal({ app: handle, ...input });
    },
    async listPendingApprovals() {
      return readPendingApprovals(store);
    },
    async close() {
      if (closed) return;
      closed = true;
      try {
        if (server.listeningOn !== undefined) {
          await server.stop();
        }
      } catch {
        // Best-effort.
      }
      try {
        if (options.store === undefined) {
          await store.close();
        }
      } catch {
        // Best-effort.
      }
    },
  };
  return handle;
}

/**
 * Convenience wrapper - calls `app.server.start()` to bind the HTTP
 * listener. Returns the `{ host, port }` address from the underlying
 * `GraphorinServer.start()`.
 */
export async function startSlackBotApp(
  options: CreateSlackBotAppOptions = {},
): Promise<{ readonly host: string; readonly port: number; readonly app: SlackBotApp }> {
  const app = await createSlackBotApp(options);
  const address = await app.server.start();
  return { host: address.host, port: address.port, app };
}

/** Inputs accepted by {@link processSlackEvent}. */
export interface ProcessSlackEventTopLevelInput extends ProcessSlackEventInput {
  readonly app: SlackBotApp;
}

/**
 * Public function the smoke test exercises end-to-end. Returns the
 * outcome of the inbound event without binding a real HTTP listener.
 */
export async function processSlackEvent(
  input: ProcessSlackEventTopLevelInput,
): Promise<ProcessSlackEventResult> {
  return input.app.processSlackEvent(input);
}

/** Inputs accepted by {@link simulateApprovalLifecycle}. */
export interface SimulateApprovalLifecycleInput {
  readonly app: SlackBotApp;
  readonly expense: SubmittedExpense;
  readonly channel?: string;
  readonly threadTs?: string;
  /**
   * Operator decision delivered by the resume endpoint after the
   * simulated server restart. Defaults to `'approve'`.
   */
  readonly decision?: 'approve' | 'deny';
  readonly reason?: string;
  /**
   * Optional factory that re-creates the app from the same SQLite
   * store. Tests pass `() => createSlackBotApp({ store: app.store })` to
   * exercise a true close + re-open boundary; callers that only want
   * the in-process pause/resume can leave this off.
   */
  readonly restartFactory?: (oldApp: SlackBotApp) => Promise<SlackBotApp>;
}

/** Result returned by {@link simulateApprovalLifecycle}. */
export interface SimulateApprovalLifecycleResult {
  readonly initial: ProcessSlackEventResult;
  readonly pendingBeforeRestart: ReadonlyArray<PendingApprovalRecord>;
  readonly pendingAfterRestart: ReadonlyArray<PendingApprovalRecord>;
  readonly resume: HandleSlackApprovalResult;
  readonly slackMessages: ReadonlyArray<RecordedSlackMessage>;
  /**
   * The post-restart app handle (when {@link restartFactory} is set);
   * otherwise the same handle the caller passed in. Callers are
   * responsible for closing the returned handle.
   */
  readonly resumedApp: SlackBotApp;
}

/**
 * Headline durable-HITL helper. Submits an expense → the agent pauses
 * on `tool.approval.requested` → the example posts an "approval needed"
 * Slack message → the routing row is recovered after a simulated
 * restart → the operator resolves the approval → the agent completes.
 */
export async function simulateApprovalLifecycle(
  input: SimulateApprovalLifecycleInput,
): Promise<SimulateApprovalLifecycleResult> {
  const channel = input.channel ?? input.app.defaultChannel;
  const threadTs = input.threadTs ?? `1700000000.${Date.now().toString().slice(-6)}`;
  const decision = input.decision ?? 'approve';
  const reason = input.reason ?? 'OK';

  const initial = await input.app.processSlackEvent({
    event: buildExpenseEvent({ expense: input.expense, channel, threadTs }),
    skipSignatureCheck: true,
  });
  const pendingBeforeRestart = await input.app.listPendingApprovals();

  let resumedApp: SlackBotApp = input.app;
  if (input.restartFactory !== undefined) {
    resumedApp = await input.restartFactory(input.app);
  }
  const pendingAfterRestart = await resumedApp.listPendingApprovals();

  const target = pendingAfterRestart[0];
  if (target === undefined) {
    return {
      initial,
      pendingBeforeRestart,
      pendingAfterRestart,
      resume: {
        status: 'unknown_run' as const,
        runId: initial.runId ?? 'unknown',
      },
      slackMessages: collectMessages(resumedApp.slackClient),
      resumedApp,
    };
  }
  const resume = await resumedApp.handleSlackApproval({
    runId: target.runId,
    decision,
    reason,
  });
  return {
    initial,
    pendingBeforeRestart,
    pendingAfterRestart,
    resume,
    slackMessages: collectMessages(resumedApp.slackClient),
    resumedApp,
  };
}

interface ProcessSlackEventInternalInput extends ProcessSlackEventInput {
  readonly app: SlackBotApp;
  readonly slackUserId: string;
  readonly signingSecret?: string;
}

async function processSlackEventInternal(
  input: ProcessSlackEventInternalInput,
): Promise<ProcessSlackEventResult> {
  const { app, event } = input;
  if (event.type === 'url_verification') {
    const challenge = event.challenge ?? '';
    return { status: 'challenge' as const, challenge };
  }
  if (input.skipSignatureCheck !== true) {
    const verdict = verifyInboundSignature({
      rawBody: input.rawBody,
      headers: input.headers,
      signingSecret: input.signingSecret,
      bridge: app.slackBridge,
    });
    if (!verdict.ok) {
      return { status: 'rejected' as const, reason: verdict.reason };
    }
  }
  if (event.type !== 'event_callback' || event.event === undefined) {
    return { status: 'rejected' as const, reason: 'unsupported-event' };
  }
  const inner = event.event;
  if (inner.text.length === 0) {
    return { status: 'rejected' as const, reason: 'empty-text' };
  }

  const channel = inner.channel.length > 0 ? inner.channel : app.defaultChannel;
  const threadTs = inner.thread_ts ?? inner.ts;

  await app.session.push({ role: 'user', content: inner.text });

  let assistantText = '';
  let runId: string | undefined;
  let approvalRequested:
    | { readonly toolCallId: string; readonly approval?: ToolApproval }
    | undefined;
  const stream = app.agent.stream(inner.text, {
    sessionId: app.sessionId,
    userId: app.userId,
  }) as AsyncIterable<AgentEvent<string>>;
  for await (const ev of stream) {
    if (ev.type === 'agent.start') {
      runId = ev.runId;
    } else if (ev.type === 'text.delta') {
      assistantText += ev.delta;
    } else if (ev.type === 'tool.approval.requested') {
      approvalRequested = { toolCallId: ev.toolCallId };
    } else if (ev.type === 'agent.error') {
      throw new Error(
        `[graphorin/example-slack-bot-integration] agent failed mid-turn: ` +
          `${ev.error.code} - ${ev.error.message}`,
      );
    }
  }

  if (approvalRequested !== undefined && runId !== undefined) {
    const approval = await readPendingApprovalFromCheckpoint(app.store, runId);
    if (approval !== undefined) {
      const expense = parseExpenseArgs(approval.args);
      await persistRouting(app.store, {
        runId,
        toolCallId: approval.toolCallId,
        channel,
        ...(threadTs !== undefined ? { threadTs } : {}),
        expense,
      });
      const posted = await app.slackClient.postMessage({
        channel,
        text:
          `Approval required: ${input.slackUserId} requested an expense ` +
          `for $${expense.amount.toFixed(2)} (${expense.justification}). ` +
          `Run id ${runId}.`,
        thread_ts: threadTs,
        buttons: [
          { text: 'Approve', value: `approve:${runId}`, style: 'primary' },
          { text: 'Deny', value: `deny:${runId}`, style: 'danger' },
        ],
        metadata: { runId, toolCallId: approval.toolCallId },
      });
      return {
        status: 'awaiting_approval' as const,
        runId,
        slackMessageTs: posted.ts,
      };
    }
  }

  if (assistantText.length > 0) {
    await app.session.push({
      role: 'assistant',
      content: assistantText,
      agentId: app.agentId,
    });
    const posted = await app.slackClient.postMessage({
      channel,
      text: assistantText,
      thread_ts: threadTs,
    });
    return {
      status: 'ok' as const,
      ...(runId !== undefined ? { runId } : {}),
      assistantText,
      slackMessageTs: posted.ts,
    };
  }

  return {
    status: 'ok' as const,
    ...(runId !== undefined ? { runId } : {}),
    assistantText: '',
  };
}

interface HandleSlackApprovalInternalInput extends HandleSlackApprovalInput {
  readonly app: SlackBotApp;
}

async function handleSlackApprovalInternal(
  input: HandleSlackApprovalInternalInput,
): Promise<HandleSlackApprovalResult> {
  const { app, runId } = input;
  const routing = readRoutingRow(app.store, runId);
  if (routing === undefined) {
    return { status: 'unknown_run' as const, runId };
  }
  const tuple = await app.store.checkpoints.getTuple(runId, SLACK_ROUTING_NS);
  if (tuple === null) {
    deleteRoutingRow(app.store, runId);
    return { status: 'unknown_run' as const, runId };
  }
  const savedState = tuple.checkpoint.state as RunState;
  const granted = input.decision === 'approve';
  const directiveReason = input.reason ?? (granted ? 'approved' : 'denied');

  let assistantText = '';
  const stream = app.agent.stream(savedState, {
    sessionId: savedState.sessionId,
    ...(savedState.userId !== undefined ? { userId: savedState.userId } : {}),
    directive: {
      approvals: [{ toolCallId: routing.toolCallId, granted, reason: directiveReason }],
    },
  }) as AsyncIterable<AgentEvent<string>>;
  for await (const ev of stream) {
    if (ev.type === 'text.delta') assistantText += ev.delta;
    else if (ev.type === 'agent.error') {
      throw new Error(
        `[graphorin/example-slack-bot-integration] agent resume failed: ` +
          `${ev.error.code} - ${ev.error.message}`,
      );
    }
  }

  if (assistantText.length === 0) {
    // The agent may have stayed paused (e.g. partial approval set).
    // Surface that state to callers so they can re-poll.
    const refreshed = await app.store.checkpoints.getTuple(runId, SLACK_ROUTING_NS);
    if (refreshed !== null) {
      const refreshedState = refreshed.checkpoint.state as RunState;
      if (refreshedState.status === 'awaiting_approval') {
        return { status: 'still_pending' as const, runId };
      }
    }
  }

  if (assistantText.length > 0) {
    await app.session.push({
      role: 'assistant',
      content: assistantText,
      agentId: app.agentId,
    });
    const posted = await app.slackClient.postMessage({
      channel: routing.channel,
      text: assistantText,
      ...(routing.threadTs !== undefined ? { thread_ts: routing.threadTs } : {}),
      metadata: {
        runId,
        decision: granted ? 'approved' : 'denied',
      },
    });
    deleteRoutingRow(app.store, runId);
    return {
      status: granted ? ('completed' as const) : ('denied' as const),
      assistantText,
      slackMessageTs: posted.ts,
      runId,
    };
  }

  deleteRoutingRow(app.store, runId);
  return { status: granted ? ('completed' as const) : ('denied' as const), runId };
}

interface PersistRoutingInput {
  readonly runId: string;
  readonly toolCallId: string;
  readonly channel: string;
  readonly threadTs?: string;
  readonly expense: SubmittedExpense;
}

async function persistRouting(
  store: GraphorinSqliteStore,
  input: PersistRoutingInput,
): Promise<void> {
  store.connection.run(
    `INSERT OR REPLACE INTO slack_pending_approvals (
       run_id, tool_call_id, channel, thread_ts, expense_json, recorded_at
     ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.runId,
      input.toolCallId,
      input.channel,
      input.threadTs ?? null,
      JSON.stringify(input.expense),
      Date.now(),
    ],
  );
}

interface RoutingRow {
  run_id: string;
  tool_call_id: string;
  channel: string;
  thread_ts: string | null;
  expense_json: string;
  recorded_at: number;
}

function readRoutingRow(
  store: GraphorinSqliteStore,
  runId: string,
):
  | { readonly toolCallId: string; readonly channel: string; readonly threadTs?: string }
  | undefined {
  const row = store.connection.get<RoutingRow>(
    'SELECT * FROM slack_pending_approvals WHERE run_id = ?',
    [runId],
  );
  if (row === undefined) return undefined;
  return {
    toolCallId: row.tool_call_id,
    channel: row.channel,
    ...(row.thread_ts !== null ? { threadTs: row.thread_ts } : {}),
  };
}

function deleteRoutingRow(store: GraphorinSqliteStore, runId: string): void {
  store.connection.run('DELETE FROM slack_pending_approvals WHERE run_id = ?', [runId]);
}

async function readPendingApprovals(
  store: GraphorinSqliteStore,
): Promise<ReadonlyArray<PendingApprovalRecord>> {
  const rows = store.connection.all<RoutingRow>(
    'SELECT * FROM slack_pending_approvals ORDER BY recorded_at',
  );
  return rows.map((row) => {
    const expense = parseExpenseRow(row.expense_json);
    return Object.freeze({
      runId: row.run_id,
      toolCallId: row.tool_call_id,
      channel: row.channel,
      ...(row.thread_ts !== null ? { threadTs: row.thread_ts } : {}),
      expense,
      recordedAt: new Date(row.recorded_at).toISOString(),
    });
  });
}

function parseExpenseRow(raw: string): SubmittedExpense {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'object' && parsed !== null) {
      const v = parsed as { readonly amount?: unknown; readonly justification?: unknown };
      const amount = typeof v.amount === 'number' && Number.isFinite(v.amount) ? v.amount : 0;
      const justification = typeof v.justification === 'string' ? v.justification : '';
      return { amount, justification };
    }
  } catch {
    // Fall through to the empty default.
  }
  return { amount: 0, justification: '' };
}

function parseExpenseArgs(args: unknown): SubmittedExpense {
  if (typeof args === 'object' && args !== null) {
    const v = args as { readonly amount?: unknown; readonly justification?: unknown };
    const amount = typeof v.amount === 'number' && Number.isFinite(v.amount) ? v.amount : 0;
    const justification = typeof v.justification === 'string' ? v.justification : '';
    return { amount, justification };
  }
  return { amount: 0, justification: '' };
}

async function readPendingApprovalFromCheckpoint(
  store: GraphorinSqliteStore,
  runId: string,
): Promise<ToolApproval | undefined> {
  const tuple = await store.checkpoints.getTuple(runId, SLACK_ROUTING_NS);
  if (tuple === null) return undefined;
  const state = tuple.checkpoint.state as RunState;
  const pending = state.pendingApprovals;
  return pending.length > 0 ? pending[pending.length - 1] : undefined;
}

interface BuildServerInput {
  readonly store: GraphorinSqliteStore;
  readonly agent: Agent<undefined, string>;
  readonly agentId: string;
  readonly serverOverrides?: ServerOverrides;
  readonly env: NodeJS.ProcessEnv;
}

async function buildServer(input: BuildServerInput): Promise<GraphorinServer> {
  const overrides = input.serverOverrides;
  const authEnabled = overrides?.auth?.enabled === true;
  const pepperEnvVar = overrides?.auth?.pepperEnvVar ?? 'GRAPHORIN_SLACK_BOT_PEPPER';
  const baseConfig: CreateServerOptions['config'] = authEnabled
    ? {
        auth: { kind: 'token' as const, pepperRef: `env:${pepperEnvVar}` },
        audit: { enabled: false },
        server: {
          rateLimit: { enabled: false },
          csrf: { enabled: false },
          ws: { enabled: false },
          sse: { enabled: false },
        },
      }
    : {
        auth: { kind: 'none' as const },
        audit: { enabled: false },
        server: {
          rateLimit: { enabled: false },
          csrf: { enabled: false },
          ws: { enabled: false },
          sse: { enabled: false },
        },
      };

  const server = await createServer({
    store: input.store,
    skipHardening: true,
    skipListen: true,
    config: baseConfig,
  });
  const adapter: ServerAgentLike = {
    id: input.agentId,
    async run(rawInput, options) {
      const opts: { signal?: AbortSignal; sessionId?: string; userId?: string } = {};
      if (options?.signal !== undefined) opts.signal = options.signal;
      if (options?.sessionId !== undefined) opts.sessionId = options.sessionId;
      if (options?.userId !== undefined) opts.userId = options.userId;
      const inputAsString = typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput);
      return input.agent.run(inputAsString, opts);
    },
  };
  server.agents.register({
    id: input.agentId,
    agent: adapter,
    description: 'Slack bridge bot - routes Slack messages through the Graphorin agent loop.',
    tags: ['slack', 'integration', 'example'],
  });
  // Touch the env so eager linters confirm the env var read path is wired.
  void input.env;
  return server;
}

interface VerifyInboundInput {
  readonly rawBody: string | undefined;
  readonly headers: Readonly<Record<string, string | undefined>> | undefined;
  readonly signingSecret: string | undefined;
  readonly bridge: SlackBridge;
}

function verifyInboundSignature(
  input: VerifyInboundInput,
):
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'no-secret' | 'stale' | 'malformed' | 'mismatch' } {
  const headers = input.headers ?? {};
  const timestamp = headers['x-slack-request-timestamp'] ?? '';
  const signature = headers['x-slack-signature'] ?? '';
  return input.bridge.verifySignature({
    rawBody: input.rawBody ?? '',
    timestamp,
    signature,
  });
}

interface VerifySlackSignatureInternalInput {
  readonly rawBody: string;
  readonly timestamp: string;
  readonly signature: string;
  readonly signingSecret: string | undefined;
  readonly toleranceSeconds?: number;
  readonly now?: () => number;
}

function verifySlackSignatureSync(input: VerifySlackSignatureInternalInput): VerifySignatureResult {
  if (input.signingSecret === undefined || input.signingSecret.length === 0) {
    return { ok: false as const, reason: 'no-secret' as const };
  }
  if (input.timestamp.length === 0 || input.signature.length === 0) {
    return { ok: false as const, reason: 'malformed' as const };
  }
  const ts = Number(input.timestamp);
  if (!Number.isFinite(ts)) return { ok: false as const, reason: 'malformed' as const };
  const tolerance = input.toleranceSeconds ?? 300;
  const now = input.now ?? Date.now;
  if (Math.abs(now() / 1000 - ts) > tolerance) {
    return { ok: false as const, reason: 'stale' as const };
  }
  const baseString = `v0:${input.timestamp}:${input.rawBody}`;
  const expected = `v0=${createHmac('sha256', input.signingSecret).update(baseString).digest('hex')}`;
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(input.signature, 'utf8');
  if (expectedBuf.length !== actualBuf.length) {
    return { ok: false as const, reason: 'mismatch' as const };
  }
  return timingSafeEqual(expectedBuf, actualBuf)
    ? { ok: true as const }
    : { ok: false as const, reason: 'mismatch' as const };
}

interface BuildExpenseEventInput {
  readonly expense: SubmittedExpense;
  readonly channel: string;
  readonly threadTs: string;
}

function buildExpenseEvent(input: BuildExpenseEventInput): SlackEventEnvelope {
  const text = `submit expense $${input.expense.amount.toFixed(2)} for ${input.expense.justification}`;
  const inner: SlackInnerEvent = {
    type: 'message' as const,
    user: 'U-SLACK-USER',
    text,
    channel: input.channel,
    ts: input.threadTs,
    thread_ts: input.threadTs,
  };
  return {
    type: 'event_callback' as const,
    event: inner,
  };
}

function collectMessages(client: SlackClient): ReadonlyArray<RecordedSlackMessage> {
  if (isInMemorySlackClient(client)) {
    return Object.freeze([...client.messages]);
  }
  return Object.freeze([]);
}

function isInMemorySlackClient(client: SlackClient): client is InMemorySlackClient {
  return Array.isArray((client as Partial<InMemorySlackClient>).messages);
}

// Keep `Message` referenced for downstream type-aware editors via a
// type-only export below; no runtime side effects.
export type { Message } from '@graphorin/core';

/**
 * CLI entry point. Boots the app against an in-memory store, runs both
 * the happy-path and approval flows end-to-end with the deterministic
 * stub Slack client, and prints a one-line summary.
 */
export async function main(args: { readonly env?: NodeJS.ProcessEnv } = {}): Promise<number> {
  const env = args.env ?? process.env;
  const slack = createInMemorySlackClient();
  const app = await createSlackBotApp({
    env,
    dbPath: ':memory:',
    slackClient: slack,
  });
  try {
    const happy = await app.processSlackEvent({
      event: {
        type: 'event_callback' as const,
        event: {
          type: 'message' as const,
          user: 'U-SLACK-USER',
          text: 'Hello, graphorin!',
          channel: app.defaultChannel,
          ts: '1700000000.000001',
        },
      },
      skipSignatureCheck: true,
    });
    const approval = await simulateApprovalLifecycle({
      app,
      expense: { amount: 500, justification: 'engineering offsite travel' },
    });
    process.stdout.write(
      `graphorin v${VERSION} slack-bot-integration - ` +
        `recipe='${app.recipe}', happy='${happy.status}', ` +
        `approval='${approval.resume.status}', ` +
        `slackMessages=${approval.slackMessages.length}.\n`,
    );
    return 0;
  } finally {
    await app.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
