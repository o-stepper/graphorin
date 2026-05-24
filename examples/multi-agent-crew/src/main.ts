/**
 * Graphorin v0.3.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Multi-agent crew acceptance demo — library mode. Wires a supervisor +
 * two specialised worker agents (`worker-a` researcher / `worker-b`
 * writer) through `createAgent({ handoffs: [...] })` so the agent
 * runtime auto-generates `transfer_to_<worker>` tools and emits a
 * `HandoffRecord` per transfer. All three agents share one
 * `SessionManager` — every assistant message is pushed to the session
 * with its `agentId` so `session.list({ agentId: 'worker-a' })`,
 * `session.export({ sink })` (with both `kind: 'agent'` and
 * `kind: 'handoff'` records), and `session.replay(...)` (with
 * `agents.delete(...)` + placeholder reconstruction) all work
 * end-to-end against the deterministic stub provider in `./stub-provider.ts`.
 *
 * The supervisor mounts a fake {@link createStubSecret | SecretValue}
 * on its `deps`; workers default to `inheritSecrets: []` (DEC-137 empty
 * allowlist), and the example exposes a `read-secret-from-deps` tool
 * each agent can call to confirm the isolation invariant.
 */

import process from 'node:process';
import { type Agent, createAgent, filters } from '@graphorin/agent';
import {
  type AgentEvent,
  collect,
  type HandoffFilter,
  type HandoffInputFilterDescriptor,
  type HandoffRecord,
  type Provider,
  type SecretValue,
  type Tool,
  type ToolExecutionContext,
  type Tracer,
} from '@graphorin/core';
import { optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createMemory, type Memory } from '@graphorin/memory';
import {
  type AgentRegistry,
  createBufferSink,
  createSessionManager,
  type Session,
  type SessionExportFooterRecord,
  type SessionManager,
} from '@graphorin/sessions';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { createStubSecret, type StubSecretValue } from './secret-stub.js';
import {
  createCrewStubProvider,
  ROLE_MARKERS,
  TRANSFER_TOOLS,
  WORKER_NAMES,
} from './stub-provider.js';

/** Canonical version constant — must mirror `package.json`. */
export const VERSION = '0.3.0';

/** Recipe selector — only `'stub'` ships in v0.1 (CI hermetic). */
export type Recipe = 'stub';

const ALL_RECIPES: ReadonlyArray<Recipe> = ['stub'];

const DEFAULT_TASK =
  'Summarise the design considerations for a multi-agent supervisor + worker crew.';
const SUPERVISOR_NAME = 'supervisor';

/** Resolve the configured recipe. Defaults to `'stub'`. */
export function resolveRecipe(env: NodeJS.ProcessEnv = process.env): Recipe {
  const raw = (env.GRAPHORIN_LLM_RECIPE ?? 'stub').trim().toLowerCase();
  if ((ALL_RECIPES as ReadonlyArray<string>).includes(raw)) {
    return raw as Recipe;
  }
  throw new TypeError(
    `[graphorin/example-multi-agent-crew] Unknown GRAPHORIN_LLM_RECIPE='${raw}'. ` +
      `Pick one of ${ALL_RECIPES.join(', ')}.`,
  );
}

/**
 * Per-agent dependencies surfaced via `agent.config.deps` and threaded
 * into every tool execution context. The supervisor mounts a fake
 * secret so the smoke test can assert workers cannot reach it.
 */
export interface CrewDeps {
  readonly secret?: SecretValue;
}

/** Inputs shared by every per-role factory. */
export interface RoleFactoryOptions {
  readonly provider: Provider;
  readonly sessionId?: string;
  readonly tracer?: Tracer;
}

/**
 * Build the canonical default handoff filter applied by the supervisor
 * (`compose(lastN(10), stripReasoning)` per DEC-146 / RB-40). The
 * `compose(...)` helper auto-appends `stripReasoning()` so reasoning
 * content never crosses the handoff boundary; the resulting descriptor
 * surfaces as `{ kind: 'compose', meta: { steps: [...] } }`.
 */
export function buildDefaultHandoffFilter(): ReturnType<typeof filters.compose> {
  return filters.compose(filters.lastN(10), filters.stripReasoning());
}

const READ_SECRET_TOOL_SCHEMA = {
  parse: (v: unknown): unknown => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object', properties: {} }),
} as const;

/**
 * Tool factory: a per-agent helper that reads `ctx.runContext.deps`
 * and reports whether the supervisor's secret is reachable. The
 * supervisor sees `secret-len=N`; workers, whose `deps` is `undefined`
 * by default, see `<no-secret>` — proving the DEC-137 isolation
 * invariant.
 */
export function buildReadSecretTool(): Tool<unknown, string, CrewDeps> {
  const tool: Tool<unknown, string, CrewDeps> = {
    name: 'read-secret-from-deps',
    description: 'Probe the agent-level deps for the operator-mounted SecretValue.',
    inputSchema: READ_SECRET_TOOL_SCHEMA as unknown as Tool<
      unknown,
      string,
      CrewDeps
    >['inputSchema'],
    sideEffectClass: 'pure',
    async execute(_input: unknown, ctx: ToolExecutionContext<CrewDeps>): Promise<string> {
      const secret = ctx.runContext.deps?.secret;
      if (secret === undefined) return '<no-secret>';
      return secret.use((raw) => `secret-len=${raw.length}`);
    },
  };
  return tool;
}

/**
 * Build the researcher (worker-a). Receives a research task from the
 * supervisor's `transfer_to_worker-a` handoff; produces a synthesised
 * snippet. Default `deps` is `undefined` — the worker has no access to
 * the supervisor's secret per DEC-137.
 */
export function createResearcher(options: RoleFactoryOptions): Agent<CrewDeps, string> {
  const { provider } = options;
  return createAgent<CrewDeps, string>({
    name: WORKER_NAMES.researcher,
    instructions:
      `${ROLE_MARKERS.researcher} You are the Researcher worker. ` +
      'Synthesise the supervisor request into a concise research snippet ' +
      'enumerating prior art, open questions, and recommended sources.',
    provider,
    tools: [buildReadSecretTool()],
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.tracer !== undefined ? { tracer: options.tracer } : {}),
  });
}

/**
 * Build the writer (worker-b). Receives the researcher's output via
 * the supervisor's filtered handoff history; produces a polished
 * paragraph. Same secrets-isolation defaults as {@link createResearcher}.
 */
export function createWriter(options: RoleFactoryOptions): Agent<CrewDeps, string> {
  const { provider } = options;
  return createAgent<CrewDeps, string>({
    name: WORKER_NAMES.writer,
    instructions:
      `${ROLE_MARKERS.writer} You are the Writer worker. ` +
      "Read the most recent tool message (the researcher's output) and " +
      'rewrite it as a polished paragraph the operator can ship.',
    provider,
    tools: [buildReadSecretTool()],
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.tracer !== undefined ? { tracer: options.tracer } : {}),
  });
}

/** Inputs accepted by {@link createSupervisor}. */
export interface SupervisorFactoryOptions extends RoleFactoryOptions {
  readonly researcher: Agent<CrewDeps, string>;
  readonly writer: Agent<CrewDeps, string>;
  /** Mounted on `agent.config.deps`; workers cannot see this. */
  readonly secret?: SecretValue;
}

/**
 * Build the supervisor. Wires the two workers as `handoffs: [...]`
 * targets so the agent runtime auto-generates `transfer_to_worker-a`
 * and `transfer_to_worker-b` tools. The explicit
 * `compose(lastN(10), stripReasoning())` filter pins the DEC-146
 * default at the call site so the {@link HandoffRecord.inputFilter}
 * descriptor is byte-stable across runs.
 */
export function createSupervisor(options: SupervisorFactoryOptions): Agent<CrewDeps, string> {
  const { provider, researcher, writer } = options;
  const handoffFilter = buildDefaultHandoffFilter();
  const handoffEntries: ReadonlyArray<{
    readonly target: Agent<CrewDeps, unknown>;
    readonly inputFilter: HandoffFilter;
  }> = [
    { target: researcher as unknown as Agent<CrewDeps, unknown>, inputFilter: handoffFilter },
    { target: writer as unknown as Agent<CrewDeps, unknown>, inputFilter: handoffFilter },
  ];
  return createAgent<CrewDeps, string>({
    name: SUPERVISOR_NAME,
    instructions:
      `${ROLE_MARKERS.supervisor} You are the Supervisor. ` +
      `Decompose the user's task: first delegate research to ` +
      `'${WORKER_NAMES.researcher}' via 'transfer_to_${WORKER_NAMES.researcher}', ` +
      `then delegate writing to '${WORKER_NAMES.writer}' via ` +
      `'transfer_to_${WORKER_NAMES.writer}', then stitch both worker ` +
      'outputs into a single final paragraph.',
    provider,
    tools: [buildReadSecretTool()],
    handoffs: handoffEntries,
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    ...(options.secret !== undefined ? { deps: { secret: options.secret } } : {}),
    ...(options.tracer !== undefined ? { tracer: options.tracer } : {}),
  });
}

/** Outputs returned by {@link runCrew}. */
export interface RunCrewResult {
  readonly session: Session;
  readonly sessionManager: SessionManager;
  readonly supervisor: Agent<CrewDeps, string>;
  readonly workers: {
    readonly researcher: Agent<CrewDeps, string>;
    readonly writer: Agent<CrewDeps, string>;
  };
  readonly handoffs: ReadonlyArray<HandoffRecord>;
  readonly output: string;
  readonly secret: StubSecretValue;
  readonly store: GraphorinSqliteStore;
  /** Underlying SQLite store; close to release the file handle. */
  close(): Promise<void>;
}

/** Inputs accepted by {@link runCrew}. */
export interface RunCrewOptions {
  readonly task?: string;
  readonly recipe?: Recipe;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly storePath?: string;
  /** Inject a {@link Provider} directly (bypasses the recipe selector). */
  readonly providerOverride?: Provider;
  /** Override the secret label used by {@link createStubSecret}. */
  readonly secretLabel?: string;
  readonly env?: NodeJS.ProcessEnv;
}

/** Build the configured `Provider` for the chosen recipe. */
export function buildProvider(_recipe: Recipe): Provider {
  return createCrewStubProvider();
}

/**
 * Run the full supervisor + 2-worker crew end-to-end. Streams the
 * supervisor agent, captures `handoff` + `tool.execute.end` events,
 * pushes per-agent attributed assistant messages into the session
 * memory, and appends one {@link HandoffRecord} per transfer.
 *
 * Returns the live `Session` plus the aggregated handoff records, the
 * final supervisor output, and the underlying store handle so callers
 * can `close()` cleanly when done.
 */
export async function runCrew(options: RunCrewOptions = {}): Promise<RunCrewResult> {
  const env = options.env ?? process.env;
  const recipe = options.recipe ?? resolveRecipe(env);
  const task = options.task ?? DEFAULT_TASK;
  const userId = options.userId ?? (env.GRAPHORIN_USER_ID ?? 'crew-operator').trim();
  const storePath = options.storePath ?? ':memory:';

  const store = await createSqliteStore({
    path: storePath,
    skipSqliteVec: true,
    ...(storePath === ':memory:' ? { disableWalHardening: true } : {}),
  });
  await store.init();

  const memory: Memory = createMemory({
    store: store.memory as never,
    embeddings: store.embeddings,
  });

  const sessionManager = createSessionManager({
    store: store.sessions as unknown as Parameters<typeof createSessionManager>[0]['store'],
    memory: memory.session,
  });

  await sessionManager.agents.register(SUPERVISOR_NAME, { displayName: 'Supervisor' });
  await sessionManager.agents.register(WORKER_NAMES.researcher, {
    displayName: 'Researcher (worker-a)',
  });
  await sessionManager.agents.register(WORKER_NAMES.writer, {
    displayName: 'Writer (worker-b)',
  });

  const session = await sessionManager.create({
    userId,
    agentId: SUPERVISOR_NAME,
    ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
    title: 'multi-agent crew demo',
  });

  const provider = options.providerOverride ?? buildProvider(recipe);
  const secret = createStubSecret(
    'crew-supervisor-token-please-do-not-leak',
    options.secretLabel ?? 'crew-supervisor',
  );

  const tracer = optionalTracerFromEnv(env);
  const researcher = createResearcher({
    provider,
    sessionId: session.id,
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const writer = createWriter({
    provider,
    sessionId: session.id,
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const supervisor = createSupervisor({
    provider,
    researcher,
    writer,
    secret,
    sessionId: session.id,
    ...(tracer !== undefined ? { tracer } : {}),
  });

  await session.push({ role: 'user', content: task });

  const stream = supervisor.stream(task, { sessionId: session.id, userId });
  const events = (await collect(stream as AsyncIterable<AgentEvent<string>>)) as ReadonlyArray<
    AgentEvent<string>
  >;

  const recordedHandoffs: HandoffRecord[] = [];
  let stepNumber = 0;
  const transferToolByCallId = new Map<string, string>();
  const handoffFilterDescriptor: HandoffInputFilterDescriptor =
    buildDefaultHandoffFilter().descriptor;
  let supervisorOutput = '';

  for (const ev of events) {
    if (ev.type === 'step.start') stepNumber = ev.stepNumber;

    if (ev.type === 'tool.call.start') {
      if (ev.toolName === TRANSFER_TOOLS.researcher || ev.toolName === TRANSFER_TOOLS.writer) {
        transferToolByCallId.set(ev.toolCallId, ev.toolName);
      }
    }

    if (ev.type === 'tool.execute.end') {
      const toolName = transferToolByCallId.get(ev.toolCallId);
      if (toolName === undefined) continue;
      const workerName =
        toolName === TRANSFER_TOOLS.researcher ? WORKER_NAMES.researcher : WORKER_NAMES.writer;
      const text = typeof ev.result === 'string' ? ev.result : JSON.stringify(ev.result ?? '');
      await session.push({ role: 'assistant', content: text, agentId: workerName });
      const record = await session.appendHandoff({
        fromAgentId: SUPERVISOR_NAME,
        toAgentId: workerName,
        stepNumber,
        inputFilter: handoffFilterDescriptor,
        secretsInheritance: 'inherit-allowlist',
        inheritedSecrets: [],
      });
      recordedHandoffs.push(record);
    }

    if (ev.type === 'text.complete') {
      supervisorOutput = ev.text;
      await session.push({
        role: 'assistant',
        content: ev.text,
        agentId: SUPERVISOR_NAME,
      });
    }

    if (ev.type === 'agent.error') {
      throw new Error(
        `[graphorin/example-multi-agent-crew] supervisor failed: ` +
          `${ev.error.code} — ${ev.error.message}`,
      );
    }
  }

  return {
    session,
    sessionManager,
    supervisor,
    workers: { researcher, writer },
    handoffs: recordedHandoffs,
    output: supervisorOutput,
    secret,
    store,
    async close() {
      await store.close();
    },
  };
}

/**
 * Convenience helper: export the session as a JSONL string. Used by
 * the smoke test and by the README's "advanced" walkthrough.
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

/**
 * Convenience helper: surface the registry placeholder for an agent id.
 * Returns `'<deleted:NAME>'` when the registry has hard-deleted the
 * agent (and `resolveOrPlaceholder` reports `kind: 'unknown'`),
 * otherwise the live `displayName`.
 */
export async function describeAgentForReplay(
  registry: AgentRegistry,
  agentId: string,
): Promise<string> {
  const lookup = await registry.resolveOrPlaceholder(agentId);
  if (lookup.kind === 'unknown') return `<deleted:${lookup.id}>`;
  return lookup.agent.displayName;
}

/**
 * CLI entry point. Runs the crew once against the stub recipe and
 * prints a concise status line.
 */
export async function main(args: { readonly env?: NodeJS.ProcessEnv } = {}): Promise<number> {
  const env = args.env ?? process.env;
  const recipe = resolveRecipe(env);
  const handle = await runCrew({ recipe, env, task: env.GRAPHORIN_CREW_TASK ?? DEFAULT_TASK });
  try {
    const { footer } = await exportSessionJsonl(handle.session);
    process.stdout.write(
      `graphorin v${VERSION} multi-agent-crew — recipe='${recipe}', ` +
        `handoffs=${handle.handoffs.length}, ` +
        `messages=${footer.messageCount}, ` +
        `agents=${footer.agentCount}, ` +
        `output='${truncate(handle.output, 96)}'.\n`,
    );
    return 0;
  } finally {
    await handle.close();
  }
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
