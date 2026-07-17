/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * The official whole-bot recipe: one long-living personal assistant
 * composed from every framework leg, fully deterministic (an in-tree
 * stub `Provider`, `:memory:` SQLite, zero network sockets):
 *
 * 1. `createAgent` - typed tools built with the `tool({...})` factory,
 *    one of them gated with `needsApproval: true` (the HITL pause).
 * 2. `createMemory` over `createSqliteStore` - facts ingested early in
 *    the flow are auto-recalled into the assembled system prompt
 *    (`autoAssembleContext` + `factsAutoRecall`), so the agent answers
 *    a later question from memory, provably.
 * 3. `@graphorin/sessions` - one `SessionManager` persists the whole
 *    conversation; `session.export({ sink })` round-trips it as JSONL.
 * 4. `@graphorin/server` - the same agent exposed over REST
 *    (`skipListen: true`, token auth with an env pepper); the demo
 *    drives run -> awaiting_approval -> resume through
 *    `server.app.request(...)` without opening a port.
 * 5. `@graphorin/proactive` - a checklist-driven `createHeartbeat` on
 *    the durable `@graphorin/triggers` scheduler produces a `notify`
 *    outcome when a reminder needs attention.
 * 6. `@graphorin/channels` - the messenger front door on the loopback
 *    testkit adapter: pairing challenge, inbound sanitization + taint
 *    seed, identity routing, outbound scrubbing.
 *
 * Library-mode by default: {@link createAssistantBotApp} wires
 * everything, {@link runAssistantBotDemo} drives the scripted flow,
 * and `main()` prints one summary line for the smoke runner.
 */

import process from 'node:process';
import { type Agent, createAgent } from '@graphorin/agent';
import {
  type ChannelAccessController,
  type ChannelGateway,
  createAccessController,
  createChannelGateway,
  createIdentityRouter,
} from '@graphorin/channels';
import { createLoopbackAdapter, type LoopbackAdapter } from '@graphorin/channels/testkit';
import type { ProactiveOutcome, Provider, SessionScope } from '@graphorin/core';
import { isMainModule, optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createMemory, defineAutoRecallStrategy, type Memory } from '@graphorin/memory';
import { createHeartbeat, type Heartbeat, type HeartbeatBeatResult } from '@graphorin/proactive';
import { createToken } from '@graphorin/security';
import { resolveSecret } from '@graphorin/security/secrets';
import { createServer, type GraphorinServer } from '@graphorin/server';
import {
  createBufferSink,
  createSessionManager,
  type Session,
  type SessionExportFooterRecord,
  type SessionManager,
} from '@graphorin/sessions';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { tool } from '@graphorin/tools';
import { createScheduler, type Scheduler, type TriggerDeclaration } from '@graphorin/triggers';
import { z } from 'zod';
/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };
import { createAssistantStubProvider, ROLE_MARKERS, STUB_TOOL_NAMES } from './stub-provider.js';

export const VERSION: string = pkg.version;

/** Recipe selector - only `'stub'` ships in v0.1 (CI hermetic). */
export type Recipe = 'stub';

const ALL_RECIPES: ReadonlyArray<Recipe> = ['stub'];

const DEFAULT_USER_ID = 'operator';
const DEFAULT_SESSION_ID = 'assistant-bot-demo';
const DEFAULT_AGENT_ID = 'assistant';
const HEARTBEAT_AGENT_ID = 'assistant-heartbeat';

/** Env var the server's token-auth pepper is resolved from. */
export const PEPPER_ENV = 'GRAPHORIN_ASSISTANT_BOT_PEPPER';

/**
 * Demo pepper installed by {@link ensurePepper} when the env var is
 * unset. Long + mixed-alphabet so `assertPepperStrength` accepts it.
 * Production deployments set {@link PEPPER_ENV} themselves.
 */
export const DEMO_PEPPER = 'assistant-bot-demo-pepper-Zq7Xw3Vt9Kp2Mn4R';

/** Deterministic pairing code the front-door demo issues. */
export const PAIRING_CODE = 'ASSIST42';

/** The fact the demo ingests and later recalls through the front door. */
export const FAVOURITE_CITY_FACT = 'The favourite city of the operator is Lisbon.';

/** Second ingested fact - proves recall picks by relevance, not recency. */
export const ANSWER_STYLE_FACT = 'The operator prefers concise plain-text answers.';

/** The front-door question the agent must answer from memory. */
export const RECALL_QUESTION = 'Which favourite city should I plan the weekend trip around?';

/** The REST task that walks the ungated tool, then parks on the gated one. */
export const APPROVAL_TASK = 'Add a reminder to water the plants, then send my daily summary.';

/** Resolve the configured recipe. Defaults to `'stub'`. */
export function resolveRecipe(env: NodeJS.ProcessEnv = process.env): Recipe {
  const raw = (env.GRAPHORIN_LLM_RECIPE ?? 'stub').trim().toLowerCase();
  if ((ALL_RECIPES as ReadonlyArray<string>).includes(raw)) {
    return raw as Recipe;
  }
  throw new TypeError(
    `[graphorin/example-assistant-bot] Unknown GRAPHORIN_LLM_RECIPE='${raw}'. ` +
      `Pick one of ${ALL_RECIPES.join(', ')}.`,
  );
}

/** Build the configured `Provider` for the chosen recipe. */
export function buildProvider(_recipe: Recipe): Provider {
  return createAssistantStubProvider();
}

/**
 * Install the demo pepper into `process.env` when the operator has not
 * set one. The `env:` secret resolver reads live `process.env`, so the
 * server's token verifier and `createToken` see the same bytes.
 */
export function ensurePepper(): string {
  if (process.env[PEPPER_ENV] === undefined || process.env[PEPPER_ENV] === '') {
    process.env[PEPPER_ENV] = DEMO_PEPPER;
  }
  return `env:${PEPPER_ENV}`;
}

/** One stored reminder. */
export interface ReminderRecord {
  readonly text: string;
  readonly due: string;
}

/** The bot's application state, mounted on the agent via `deps`. */
export interface AssistantBotDeps {
  readonly reminders: {
    add(record: ReminderRecord): number;
    list(): ReadonlyArray<ReminderRecord>;
  };
  readonly outbox: {
    push(message: string): void;
    list(): ReadonlyArray<string>;
  };
}

/** Build the in-memory application state the typed tools operate on. */
export function createAssistantBotDeps(): AssistantBotDeps {
  const reminders: ReminderRecord[] = [];
  const outbox: string[] = [];
  return {
    reminders: {
      add(record: ReminderRecord): number {
        reminders.push(record);
        return reminders.length;
      },
      list(): ReadonlyArray<ReminderRecord> {
        return [...reminders];
      },
    },
    outbox: {
      push(message: string): void {
        outbox.push(message);
      },
      list(): ReadonlyArray<string> {
        return [...outbox];
      },
    },
  };
}

/**
 * Typed tool 1: store a reminder. Side-effecting but ungated - it
 * executes as soon as the model calls it.
 */
export function buildAddReminderTool() {
  return tool({
    name: STUB_TOOL_NAMES.addReminder,
    description: 'Store a reminder for the operator (text + human-readable due hint).',
    inputSchema: z.object({ text: z.string().min(1), due: z.string().min(1) }),
    sideEffectClass: 'side-effecting',
    async execute(input: { text: string; due: string }, ctx): Promise<string> {
      const deps = ctx.runContext.deps as AssistantBotDeps;
      const count = deps.reminders.add({ text: input.text, due: input.due });
      return `reminder-saved: "${input.text}" (due ${input.due}); ${count} pending`;
    },
  });
}

/**
 * Typed tool 2: read-only reminder listing. Tagged `sensitivity:
 * 'secret'` - it reads private operator data, which arms the
 * data-flow guard's lethal-trifecta leg (private data + untrusted
 * channel input + side-effecting sinks) in shadow mode.
 */
export function buildListRemindersTool() {
  return tool({
    name: 'list_reminders',
    description: 'List every stored reminder for the operator.',
    inputSchema: z.object({}),
    sideEffectClass: 'read-only',
    sensitivity: 'secret',
    async execute(_input: Record<string, never>, ctx): Promise<string> {
      const deps = ctx.runContext.deps as AssistantBotDeps;
      const items = deps.reminders.list();
      if (items.length === 0) return 'no reminders stored';
      return items.map((r, i) => `${i + 1}. ${r.text} (due ${r.due})`).join('\n');
    },
  });
}

/**
 * Typed tool 3: the HITL gate. `needsApproval: true` makes the agent
 * runtime park the run (`status: 'awaiting_approval'`) before this
 * executes; the REST resume endpoint carries the human decision back.
 */
export function buildSendDailySummaryTool() {
  return tool({
    name: STUB_TOOL_NAMES.sendDailySummary,
    description: 'Send the daily summary to the operator (requires human approval).',
    inputSchema: z.object({}),
    sideEffectClass: 'side-effecting',
    needsApproval: true,
    async execute(_input: Record<string, never>, ctx): Promise<string> {
      const deps = ctx.runContext.deps as AssistantBotDeps;
      const pending = deps.reminders.list().length;
      const receipt = `daily-summary-sent (${pending} reminder${pending === 1 ? '' : 's'} pending)`;
      deps.outbox.push(receipt);
      return receipt;
    },
  });
}

/** Inputs accepted by {@link createAssistantBotApp}. */
export interface CreateAppOptions {
  readonly recipe?: Recipe;
  /** SQLite path (`':memory:'` for tests, a file path for durability). */
  readonly dbPath?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  /** Inject a {@link Provider} directly (bypasses the recipe selector). */
  readonly providerOverride?: Provider;
  readonly env?: NodeJS.ProcessEnv;
}

/** Handle returned by {@link createAssistantBotApp}. */
export interface AssistantBotApp {
  readonly store: GraphorinSqliteStore;
  readonly memory: Memory;
  readonly sessions: SessionManager;
  readonly session: Session;
  readonly agent: Agent<AssistantBotDeps, string>;
  readonly heartbeat: Heartbeat;
  /** Every notify outcome the heartbeat delivered, in order. */
  readonly heartbeatOutcomes: ReadonlyArray<ProactiveOutcome>;
  readonly scheduler: Scheduler;
  readonly gateway: ChannelGateway;
  readonly adapter: LoopbackAdapter;
  readonly access: ChannelAccessController;
  readonly server: GraphorinServer;
  /** Bearer token minted for the REST demo (`agents:read agents:invoke`). */
  readonly bearer: string;
  readonly deps: AssistantBotDeps;
  readonly scope: SessionScope;
  readonly recipe: Recipe;
  readonly userId: string;
  readonly sessionId: string;
  readonly agentId: string;
  /** Dispose every started subsystem (idempotent). */
  close(): Promise<void>;
}

/**
 * Wire the whole bot. Everything is started (scheduler, heartbeat,
 * gateway, server) but nothing fires on its own inside the demo
 * window: the heartbeat schedule is minutes wide and the demo drives
 * `heartbeat.beat()` / `scheduler.fire(...)` deterministically.
 */
export async function createAssistantBotApp(
  options: CreateAppOptions = {},
): Promise<AssistantBotApp> {
  const env = options.env ?? process.env;
  const recipe = options.recipe ?? resolveRecipe(env);
  const userId = options.userId ?? (env.GRAPHORIN_USER_ID ?? DEFAULT_USER_ID).trim();
  const sessionId = options.sessionId ?? DEFAULT_SESSION_ID;
  const agentId = DEFAULT_AGENT_ID;
  const dbPath = options.dbPath ?? env.GRAPHORIN_DB_PATH ?? ':memory:';
  const pepperRef = ensurePepper();

  const store = await createSqliteStore({
    path: dbPath,
    mode: 'lib',
    // The recipe runs without the sqlite-vec native extension: fact
    // recall rides the FTS5 leg (hybrid search degrades gracefully).
    skipSqliteVec: true,
    ...(dbPath === ':memory:' ? { disableWalHardening: true } : {}),
  });
  await store.init();

  const scope: SessionScope = { userId, sessionId, agentId };

  const memory: Memory = createMemory({
    store: store.memory,
    embeddings: store.embeddings,
    contextEngine: {
      // The stub recipe never approaches a context limit; keeping
      // auto-compaction off avoids the providerContextWindow WARN.
      compaction: false,
      // Layer 6: recall on every turn (the default locale heuristic
      // only fires on memory-flavoured phrasing; the demo wants the
      // provably-deterministic path).
      factsAutoRecall: {
        topK: 3,
        strategy: defineAutoRecallStrategy({
          id: 'assistant-bot-always',
          evaluate: () => ({ factsTriggered: true, reason: 'demo-always-recall' }),
        }),
      },
      // The stub provider never leaves the process, so 'internal'
      // facts may enter the prompt (DEC-149 trust tiers).
      privacy: { providerTrust: 'loopback' },
    },
    resolveScope: () => scope,
  });

  const sessions: SessionManager = createSessionManager({
    store: store.sessions,
    memory: memory.session,
  });
  await sessions.agents.register(agentId, { displayName: 'Personal Assistant' });
  await sessions.agents.register(HEARTBEAT_AGENT_ID, { displayName: 'Assistant Heartbeat' });
  const session = await sessions.create({
    userId,
    agentId,
    sessionId,
    title: 'assistant-bot whole-bot recipe',
  });

  const provider = options.providerOverride ?? buildProvider(recipe);
  const tracer = optionalTracerFromEnv(env);
  const deps = createAssistantBotDeps();

  const agent = createAgent<AssistantBotDeps, string>({
    name: agentId,
    instructions:
      `${ROLE_MARKERS.assistant} You are the operator's personal assistant. ` +
      'Answer from your memory context when you can, store reminders with ' +
      'add_reminder, and never send the daily summary without approval.',
    provider,
    tools: [buildAddReminderTool(), buildListRemindersTool(), buildSendDailySummaryTool()],
    memory,
    // CE-1: assemble the memory-aware system prompt (memory base +
    // instructions + auto-recalled facts) instead of instructions alone.
    autoAssembleContext: true,
    // B1.5: arm the data-flow ledger so the channel taint seed lands.
    dataFlowPolicy: { mode: 'shadow' },
    deps,
    sessionId,
    userId,
    ...(tracer !== undefined ? { tracer } : {}),
  });

  // Dedicated heartbeat agent: `Agent.isBusy()` guards one instance's
  // in-flight run, so beats must not share the interactive instance.
  const heartbeatAgent = createAgent<undefined, string>({
    name: HEARTBEAT_AGENT_ID,
    instructions:
      `${ROLE_MARKERS.heartbeat} You are the assistant's background beat. ` +
      'Work through the checklist; reply HEARTBEAT_OK when nothing needs attention.',
    provider,
    // C6 cheap-run posture: instructions-only prompt, deferred tools.
    scaffold: 'minimal',
    ...(tracer !== undefined ? { tracer } : {}),
  });

  const scheduler: Scheduler = createScheduler({ store: store.triggers, mode: 'lib' });
  await scheduler.start();

  const heartbeatOutcomes: ProactiveOutcome[] = [];
  const heartbeat = createHeartbeat({
    agent: heartbeatAgent,
    // The composition root acknowledges lib-mode semantics (triggers
    // fire only while this process lives) for the heartbeat schedule.
    scheduler: withLibModeAcknowledged(scheduler),
    id: 'assistant-bot-heartbeat',
    schedule: { every: 5 * 60_000 },
    // An empty checklist skips the beat before any model call - the
    // all-quiet bot costs nothing.
    checklist: () => {
      const pending = deps.reminders.list();
      if (pending.length === 0) return null;
      return (
        'Review the operator reminders and flag anything overdue:\n' +
        pending.map((r) => `- ${r.text} (due ${r.due})`).join('\n')
      );
    },
    sessions,
    userId,
    profile: { maxTokens: 2_048 },
    onOutcome: (outcome) => {
      heartbeatOutcomes.push(outcome);
    },
  });
  await heartbeat.start();

  // The channels front door: loopback adapter (the testkit transport),
  // durable pairing on the SQLite PairingStore, identity routing, and
  // the agent as the inbound handler.
  const adapter = createLoopbackAdapter();
  const access = createAccessController({
    policy: { kind: 'pairing' },
    store: store.pairing,
    generateCode: () => PAIRING_CODE,
  });
  const gateway = createChannelGateway({
    adapters: [adapter],
    router: createIdentityRouter({
      routes: [{ channelId: adapter.id, agentId }, { agentId }],
    }),
    access,
    warn: () => {},
    onUnauthorized: async (_message, decision, io) => {
      if (decision.kind === 'pairing-challenge' && decision.issued) {
        await io.deliver({
          text: `Pairing required. Ask the operator to approve: ${decision.code}`,
        });
      }
    },
    onMessage: async (ctx) => {
      await session.push({ role: 'user', content: ctx.sanitizedText });
      const result = await agent.run(ctx.sanitizedText, {
        sessionId,
        userId,
        // The ready-made taint seed arms the run's data-flow ledger.
        inboundTaint: ctx.inboundTaint,
      });
      const reply = result.status === 'completed' ? result.output : 'Sorry, that run failed.';
      await session.push({ role: 'assistant', content: reply, agentId });
      return { text: reply };
    },
  });
  await gateway.start();

  const server: GraphorinServer = await createServer({
    store,
    skipHardening: true,
    skipListen: true,
    config: {
      auth: { kind: 'token', pepperRef },
      storage: { path: dbPath, mode: 'lib' },
      server: {
        rateLimit: { enabled: false },
        csrf: { enabled: false },
        ws: { enabled: false },
        sse: { enabled: false },
      },
    },
  });
  server.agents.register({ id: agentId, description: 'the whole-bot personal assistant', agent });
  await server.start();

  const pepper = await resolveSecret(pepperRef);
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ['agents:read', 'agents:invoke'],
    label: 'assistant-bot demo token',
  });
  const bearer = await minted.raw.use((v) => v);

  let closed = false;
  return {
    store,
    memory,
    sessions,
    session,
    agent,
    heartbeat,
    heartbeatOutcomes,
    scheduler,
    gateway,
    adapter,
    access,
    server,
    bearer,
    deps,
    scope,
    recipe,
    userId,
    sessionId,
    agentId,
    async close() {
      if (closed) return;
      closed = true;
      for (const stop of [
        () => heartbeat.stop(),
        () => gateway.stop(),
        () => scheduler.stop(),
        () => server.stop(),
        () => store.close(),
      ]) {
        try {
          await stop();
        } catch {
          // Best-effort teardown.
        }
      }
    },
  };
}

/**
 * View over a lib-mode scheduler that stamps `acknowledgeLibMode:
 * true` onto every registration. `createHeartbeat` owns its own
 * trigger declaration, so the acknowledgement (a per-declaration
 * option) has to be added where the scheduler is handed over.
 */
export function withLibModeAcknowledged(scheduler: Scheduler): Scheduler {
  // Explicit delegation - the real scheduler is a class instance, so
  // object spread would drop its prototype methods.
  return {
    register: (declaration: TriggerDeclaration) =>
      scheduler.register({
        ...declaration,
        options: { ...declaration.options, acknowledgeLibMode: true },
      }),
    unregister: (id) => scheduler.unregister(id),
    list: () => scheduler.list(),
    start: () => scheduler.start(),
    stop: () => scheduler.stop(),
    emit: (eventName, payload) => scheduler.emit(eventName, payload),
    fire: (id, payload) => scheduler.fire(id, payload),
    setDisabled: (id, disabled) => scheduler.setDisabled(id, disabled),
    events: () => scheduler.events(),
    recordActivity: () => scheduler.recordActivity(),
    orphans: () => scheduler.orphans(),
  };
}

/** Poll until `cond()` holds (the gateway queue drains asynchronously). */
export async function waitFor(cond: () => boolean, timeoutMs = 5_000): Promise<void> {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('[graphorin/example-assistant-bot] waitFor: condition not met in time');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/**
 * Leg 2 (memory): ingest the operator facts the recall question needs.
 * `semantic.remember` writes through the conflict pipeline; with
 * `skipSqliteVec` the facts index into FTS5 and recall rides the
 * lexical leg of hybrid search.
 */
export async function ingestOperatorFacts(app: AssistantBotApp): Promise<void> {
  await app.memory.semantic.remember(app.scope, { text: FAVOURITE_CITY_FACT });
  await app.memory.semantic.remember(app.scope, { text: ANSWER_STYLE_FACT });
  await app.session.push({ role: 'user', content: 'Remember: my favourite city is Lisbon.' });
  await app.session.push({
    role: 'assistant',
    content: 'Noted - I stored your favourite city (Lisbon) and your answer-style preference.',
    agentId: app.agentId,
  });
}

/**
 * Leg 6a (channels): the pairing handshake. An unknown peer is
 * challenged (the agent never runs), the operator approves the code
 * out-of-band, and the peer becomes durably paired.
 */
export async function pairFrontDoorPeer(app: AssistantBotApp): Promise<string> {
  const before = app.adapter.deliveries.length;
  await app.adapter.inject({ text: 'hello?' });
  await waitFor(() => app.adapter.deliveries.length > before);
  const challenge = app.adapter.deliveries[app.adapter.deliveries.length - 1]?.text ?? '';
  const paired = await app.access.approve(app.adapter.id, PAIRING_CODE);
  if (paired === null) {
    throw new Error('[graphorin/example-assistant-bot] pairing approval failed.');
  }
  return challenge;
}

/**
 * Leg 6b (channels + memory): send one paired inbound message through
 * the full pipeline (sanitize -> taint seed -> route -> agent run ->
 * outbound scrub) and return the delivered reply text.
 */
export async function askViaFrontDoor(app: AssistantBotApp, text: string): Promise<string> {
  const before = app.adapter.deliveries.length;
  const acceptance = await app.adapter.inject({ text });
  if (!acceptance.accepted) {
    throw new Error(
      `[graphorin/example-assistant-bot] inbound rejected: ${acceptance.reason ?? 'unknown'}`,
    );
  }
  await waitFor(() => app.adapter.deliveries.length > before);
  return app.adapter.deliveries[app.adapter.deliveries.length - 1]?.text ?? '';
}

/** What {@link runApprovalFlowOverRest} observed per phase. */
export interface ApprovalFlowResult {
  readonly runId: string;
  readonly parkedStatus: string;
  readonly pendingToolCallId: string | undefined;
  readonly stateStatus: string;
  readonly resumedStatus: string;
  readonly output: string;
  /** `send_daily_summary` executions observed via the outbox. */
  readonly gatedExecutions: number;
}

/** Auth headers for the REST demo. */
export function authHeaders(app: AssistantBotApp): Record<string, string> {
  return { Authorization: `Bearer ${app.bearer}`, 'Content-Type': 'application/json' };
}

/**
 * Legs 1 + 4 (agent + server): drive run -> awaiting_approval ->
 * resume entirely through the in-process REST surface. The ungated
 * `add_reminder` executes on the way in; `send_daily_summary` parks
 * the run until the resume carries `granted: true`.
 */
export async function runApprovalFlowOverRest(app: AssistantBotApp): Promise<ApprovalFlowResult> {
  const runRes = await app.server.app.request(`/v1/agents/${app.agentId}/run`, {
    method: 'POST',
    headers: authHeaders(app),
    body: JSON.stringify({ input: APPROVAL_TASK, sessionId: app.sessionId, userId: app.userId }),
  });
  if (runRes.status !== 200) {
    throw new Error(`[graphorin/example-assistant-bot] run failed: HTTP ${runRes.status}`);
  }
  const runBody = (await runRes.json()) as {
    runId: string;
    status: string;
    result: { state: { pendingApprovals?: Array<{ toolCallId: string }> } };
  };
  const pendingToolCallId = runBody.result.state.pendingApprovals?.[0]?.toolCallId;

  const stateRes = await app.server.app.request(`/v1/runs/${runBody.runId}/state`, {
    headers: authHeaders(app),
  });
  const stateBody = (await stateRes.json()) as { status: string };

  const resumeRes = await app.server.app.request(`/v1/runs/${runBody.runId}/resume`, {
    method: 'POST',
    headers: authHeaders(app),
    body: JSON.stringify({
      approvals: [{ toolCallId: pendingToolCallId ?? '', granted: true }],
    }),
  });
  const resumeBody = (await resumeRes.json()) as {
    status: string;
    result?: { output?: string };
  };
  const output = resumeBody.result?.output ?? '';

  await app.session.push({ role: 'user', content: APPROVAL_TASK });
  if (output.length > 0) {
    await app.session.push({ role: 'assistant', content: output, agentId: app.agentId });
  }

  return {
    runId: runBody.runId,
    parkedStatus: runBody.status,
    pendingToolCallId,
    stateStatus: stateBody.status,
    resumedStatus: resumeBody.status,
    output,
    gatedExecutions: app.deps.outbox.list().length,
  };
}

/**
 * Leg 5 (proactivity): fire one heartbeat beat now. With reminders
 * pending the checklist mentions "overdue", the stub reports a real
 * finding, and the runner delivers a `notify` outcome; the persisted
 * note lands in the session so the export shows the proactive turn.
 */
export async function runHeartbeatOnce(app: AssistantBotApp): Promise<HeartbeatBeatResult> {
  const result = await app.heartbeat.beat();
  if (result.outcome?.kind === 'notify') {
    await app.session.push({
      role: 'assistant',
      content: `[heartbeat] ${result.outcome.text}`,
      agentId: HEARTBEAT_AGENT_ID,
    });
  }
  return result;
}

/**
 * Leg 3 (sessions): export the session as JSONL. Used by the smoke
 * test and by the README walkthrough.
 */
export async function exportSessionJsonl(session: Session): Promise<{
  readonly footer: SessionExportFooterRecord;
  readonly body: string;
  readonly lines: ReadonlyArray<string>;
}> {
  const buffer = createBufferSink();
  const footer = await session.export({ sink: buffer.sink });
  return { footer, body: buffer.toString(), lines: buffer.lines };
}

/** Everything {@link runAssistantBotDemo} observed, per leg. */
export interface AssistantBotDemoResult {
  readonly pairingChallenge: string;
  readonly recallReplyText: string;
  readonly approval: ApprovalFlowResult;
  readonly heartbeatResult: HeartbeatBeatResult;
  readonly exportFooter: SessionExportFooterRecord;
  readonly summaryLine: string;
}

/**
 * Drive the whole scripted flow: ingest facts, pair the peer, answer
 * the recall question through the front door, walk the REST approval
 * flow, fire a heartbeat beat, and export the session.
 */
export async function runAssistantBotDemo(app: AssistantBotApp): Promise<AssistantBotDemoResult> {
  await ingestOperatorFacts(app);
  const pairingChallenge = await pairFrontDoorPeer(app);
  const recallReplyText = await askViaFrontDoor(app, RECALL_QUESTION);
  const approval = await runApprovalFlowOverRest(app);
  const heartbeatResult = await runHeartbeatOnce(app);
  const { footer } = await exportSessionJsonl(app.session);
  const summaryLine =
    `graphorin v${VERSION} assistant-bot: OK - recipe='${app.recipe}', ` +
    `recall='${recallReplyText.includes('Lisbon') ? 'Lisbon' : 'MISS'}', ` +
    `hitl=${approval.resumedStatus}(gated-executions=${approval.gatedExecutions}), ` +
    `heartbeat=${heartbeatResult.outcome?.kind ?? heartbeatResult.skipped ?? 'none'}, ` +
    `session-messages=${footer.messageCount}.`;
  return {
    pairingChallenge,
    recallReplyText,
    approval,
    heartbeatResult,
    exportFooter: footer,
    summaryLine,
  };
}

/**
 * CLI entry point. Boots the bot against `:memory:` SQLite, runs the
 * scripted flow once, prints the summary line, and exits cleanly.
 */
export async function main(args: { readonly env?: NodeJS.ProcessEnv } = {}): Promise<number> {
  const env = args.env ?? process.env;
  const app = await createAssistantBotApp({ env, recipe: resolveRecipe(env) });
  try {
    const demo = await runAssistantBotDemo(app);
    process.stdout.write(`${demo.summaryLine}\n`);
    return 0;
  } finally {
    await app.close();
  }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
