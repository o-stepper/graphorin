/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Long-lived agent + cron triggers acceptance demo. Wires
 * `@graphorin/triggers` cron / interval / idle declarations into a
 * `@graphorin/memory` consolidator running on the `tier: 'cheap'`
 * budget envelope (per RB-15 / DEC-144 — the framework default is
 * `'free'`; the example overrides to `'cheap'` so the standard
 * phase actually exercises the LLM extraction path). The
 * consolidator is mounted on a `@graphorin/server` instance so
 * `GET /v1/health` reports its status and `graphorin consolidator
 * status` (CLI) reads from the same daemon. The SQLite-backed
 * `TriggerStore` keeps every registration durable across simulated
 * restarts (DEC-150).
 *
 * The example is library-mode by default — the server is created
 * but inert until {@link startBackgroundConsolidator} explicitly
 * binds the listener. The smoke test exercises
 * {@link runConsolidatorCycle}, which drives a deterministic
 * cycle without touching the network.
 */

import process from 'node:process';
import { type Agent, createAgent } from '@graphorin/agent';
import type { AgentEvent, Provider, SessionScope } from '@graphorin/core';
import { optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import {
  type Consolidator,
  type ConsolidatorStatus,
  type ConsolidatorTier,
  type ConsolidatorTriggerSpec,
  createMemory,
  type Memory,
  type PhaseListener,
  type PhaseOutcome,
  type RegisterTriggersResult,
  registerConsolidatorTriggers,
} from '@graphorin/memory';
import { createProvider } from '@graphorin/provider';
import { createServer, type GraphorinServer } from '@graphorin/server';
import { createSessionManager, type Session, type SessionManager } from '@graphorin/sessions';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import {
  createScheduler,
  cron,
  idle,
  interval,
  type Scheduler,
  type SchedulerEvent,
  type TriggerDeclaration,
} from '@graphorin/triggers';
import { createStubProvider } from './stub-provider.js';

/** Canonical version constant — must mirror `package.json`. */
export const VERSION = '0.1.0';

/**
 * Recipe selector. Only `'stub'` ships in v0.1 — the example
 * demonstrates the long-lived consolidator + triggers pattern, which
 * is recipe-agnostic; swap in any `Provider` from
 * `@graphorin/provider` (Ollama, llama.cpp, …) by passing
 * `providerOverride` to {@link createBackgroundConsolidatorApp}.
 */
export type Recipe = 'stub';

const ALL_RECIPES: ReadonlyArray<Recipe> = ['stub'];

const DEFAULT_USER_ID = 'background-operator';
const DEFAULT_AGENT_ID = 'background-consolidator';
const DEFAULT_SESSION_TITLE = 'background-consolidator demo';

/**
 * Default consolidator trigger declarations. The mix demonstrates
 * the three production trigger kinds:
 *
 * - `'turn:3'`           — light phase after every 3 user turns (lib-side).
 * - `'idle:10s'`         — standard phase after 10 s without user activity.
 * - `'cron:0 3 * * *'`   — nightly maintenance window for deep replays.
 *
 * The numbers are deliberately chatty so the smoke test sees the
 * machinery; production deployments will normally widen the
 * intervals (e.g. `'turn:20'`, `'idle:5m'`, `'cron:0 4 * * *'`).
 */
export const DEFAULT_TRIGGERS: ReadonlyArray<ConsolidatorTriggerSpec> = Object.freeze([
  'turn:3',
  'idle:10s',
  'cron:0 3 * * *',
]) as ReadonlyArray<ConsolidatorTriggerSpec>;

/** Trigger id for the framework-supplied background `light` phase tick. */
export const BACKGROUND_TICK_TRIGGER_ID = 'background-consolidator:light-tick';

/** Trigger id for the framework-supplied operator-driven idle reset. */
export const IDLE_PROBE_TRIGGER_ID = 'background-consolidator:idle-probe';

/** Inputs accepted by {@link createBackgroundConsolidatorApp}. */
export interface CreateAppOptions {
  readonly recipe?: Recipe;
  /** SQLite path (`':memory:'` for tests, file path for restarts). */
  readonly dbPath?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly agentId?: string;
  /**
   * Consolidator budget envelope. Defaults to `'cheap'` so the
   * standard phase actually fires; switch back to `'free'` for
   * zero-cost operation (only the light phase runs).
   */
  readonly tier?: ConsolidatorTier;
  /** Override the provider (bypasses the recipe selector). */
  readonly providerOverride?: Provider;
  /** Process environment override — mostly used by tests. */
  readonly env?: NodeJS.ProcessEnv;
  /**
   * Override the consolidator trigger spec list. Defaults to
   * {@link DEFAULT_TRIGGERS}.
   */
  readonly triggers?: ReadonlyArray<ConsolidatorTriggerSpec>;
  /**
   * Tick interval (ms) for the framework-supplied background light
   * phase trigger. Defaults to 60_000. Tests override this so they
   * can fire the trigger deterministically with `scheduler.fire(...)`
   * without waiting for wall-clock time.
   */
  readonly lightTickIntervalMs?: number;
  /**
   * Idle probe interval (ms) — a `idle(...)` declaration the
   * framework registers separately so callers can prove idle-trigger
   * wiring without owning the parsed-from-spec id. Defaults to
   * 30_000.
   */
  readonly idleProbeMs?: number;
}

/** Handle returned by {@link createBackgroundConsolidatorApp}. */
export interface BackgroundConsolidatorApp {
  readonly store: GraphorinSqliteStore;
  readonly memory: Memory;
  readonly sessions: SessionManager;
  readonly session: Session;
  readonly agent: Agent<undefined, string>;
  readonly scheduler: Scheduler;
  readonly server: GraphorinServer;
  readonly recipe: Recipe;
  readonly userId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly scope: SessionScope;
  /**
   * Trigger ids registered by the framework on construction —
   * everything declared on the consolidator's trigger list (cron /
   * idle, parsed by {@link registerConsolidatorTriggers}) plus the
   * standalone `'background-consolidator:*'` declarations the
   * example owns directly.
   */
  readonly registeredTriggerIds: ReadonlyArray<string>;
  /** Outcome of {@link registerConsolidatorTriggers} — surfaced for tests. */
  readonly registrationResult: RegisterTriggersResult;
  /** Dispose every started subsystem (idempotent). */
  close(): Promise<void>;
}

/** Resolve the configured recipe. Defaults to `'stub'`. */
export function resolveRecipe(env: NodeJS.ProcessEnv = process.env): Recipe {
  const raw = (env.GRAPHORIN_LLM_RECIPE ?? 'stub').trim().toLowerCase();
  if ((ALL_RECIPES as ReadonlyArray<string>).includes(raw)) {
    return raw as Recipe;
  }
  throw new TypeError(
    `[graphorin/example-background-consolidator] Unknown GRAPHORIN_LLM_RECIPE='${raw}'. ` +
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
  // Exhaustive — `Recipe` only includes `'stub'` in v0.1.
  throw new TypeError(
    `[graphorin/example-background-consolidator] No provider builder for recipe='${recipe}'.`,
  );
}

/**
 * Wire the long-lived agent, six-tier `Memory`, durable trigger
 * scheduler, server handle, and consolidator daemon. The handle's
 * `scheduler` and `consolidator` are eagerly started (lib-mode) so
 * callers can immediately drive {@link runConsolidatorCycle}; the
 * `server` is *created but not started* — call
 * {@link startBackgroundConsolidator} (or `app.server.start()`) to
 * bind the HTTP listener.
 */
export async function createBackgroundConsolidatorApp(
  options: CreateAppOptions = {},
): Promise<BackgroundConsolidatorApp> {
  const env = options.env ?? process.env;
  const recipe = options.recipe ?? resolveRecipe(env);
  const userId = options.userId ?? (env.GRAPHORIN_USER_ID ?? DEFAULT_USER_ID).trim();
  const sessionId = options.sessionId ?? `bg_${Date.now().toString(36)}`;
  const agentId = options.agentId ?? DEFAULT_AGENT_ID;
  const tier: ConsolidatorTier = options.tier ?? 'cheap';
  const dbPath = options.dbPath ?? env.GRAPHORIN_DB_PATH ?? ':memory:';
  const lightTickIntervalMs = options.lightTickIntervalMs ?? 60_000;
  const idleProbeMs = options.idleProbeMs ?? 30_000;
  const triggers = options.triggers ?? DEFAULT_TRIGGERS;

  const store = await createSqliteStore({
    path: dbPath,
    ...(dbPath === ':memory:' ? { disableWalHardening: true } : {}),
  });
  await store.init();

  const provider = options.providerOverride ?? buildProvider(recipe);
  const scope: SessionScope = { userId, sessionId, agentId };

  const memory: Memory = createMemory({
    store: store.memory as never,
    embeddings: store.embeddings,
    consolidator: {
      enabled: true,
      tier,
      triggers,
      provider,
      defaultScope: scope,
    },
    resolveScope: () => scope,
  });

  const sessions: SessionManager = createSessionManager({
    store: store.sessions as unknown as Parameters<typeof createSessionManager>[0]['store'],
    memory: memory.session,
  });

  await sessions.agents.register(agentId, { displayName: 'Background Consolidator' });

  const session = await sessions.create({
    userId,
    agentId,
    sessionId,
    title: DEFAULT_SESSION_TITLE,
  });

  const tracer = optionalTracerFromEnv(env);
  const agent = createAgent<undefined, string>({
    name: agentId,
    instructions:
      'You are graphorin, a long-lived background-consolidator demo agent. ' +
      'Reply concisely; the framework consolidates memory in the background ' +
      'on a turn-based, idle, and nightly-cron schedule.',
    provider,
    memory,
    sessionId,
    userId,
    ...(tracer !== undefined ? { tracer } : {}),
  });

  const scheduler: Scheduler = createScheduler({
    store: store.triggers,
    mode: 'lib',
  });

  await memory.consolidator.start();
  await scheduler.start();

  const registrationResult = await registerConsolidatorTriggers(memory.consolidator, scheduler, {
    scope,
    acknowledgeLibMode: true,
    catchupPolicy: 'last',
  });

  // Two operator-owned triggers on top of the consolidator-declared
  // set: the light-tick interval drives a manual `light` phase
  // independently of the spec-derived ids, and the idle-probe is
  // useful for callers (CLI / tests) that want a stable id to fire.
  const operatorTriggers: ReadonlyArray<TriggerDeclaration> = Object.freeze([
    interval(
      BACKGROUND_TICK_TRIGGER_ID,
      lightTickIntervalMs,
      async () => {
        await memory.consolidator.fireNow('light', scope);
      },
      { acknowledgeLibMode: true },
    ),
    idle(
      IDLE_PROBE_TRIGGER_ID,
      idleProbeMs,
      async () => {
        await memory.consolidator.trigger({ kind: 'idle', value: 'idle-probe' }, scope);
      },
      { acknowledgeLibMode: true },
    ),
  ]);
  for (const decl of operatorTriggers) {
    await scheduler.register(decl);
  }

  const server: GraphorinServer = await createServer({
    store,
    consolidator: toConsolidatorLike(memory.consolidator, scope),
    triggers: { scheduler },
    skipHardening: true,
    skipListen: true,
    config: {
      auth: { kind: 'none' },
      audit: { enabled: false },
    },
  });

  const registeredTriggerIds: ReadonlyArray<string> = Object.freeze([
    ...registrationResult.registered.map((r) => r.id),
    ...operatorTriggers.map((t) => t.id),
  ]);

  let serverStarted = false;
  let closed = false;
  // Track server-start side-effect through the surface — the
  // framework does not expose an `isStarted` accessor, so we wrap
  // `server.start` lightly.
  const originalStart = server.start.bind(server);
  (server as { start: GraphorinServer['start'] }).start = async () => {
    const out = await originalStart();
    serverStarted = true;
    return out;
  };

  const handle: BackgroundConsolidatorApp = {
    store,
    memory,
    sessions,
    session,
    agent,
    scheduler,
    server,
    recipe,
    userId,
    sessionId,
    agentId,
    scope,
    registeredTriggerIds,
    registrationResult,
    async close() {
      if (closed) return;
      closed = true;
      try {
        await scheduler.stop();
      } catch {
        // Best-effort.
      }
      try {
        await memory.consolidator.stop();
      } catch {
        // Best-effort.
      }
      if (serverStarted) {
        try {
          await server.stop();
        } catch {
          // Best-effort.
        }
      } else {
        try {
          await store.close();
        } catch {
          // Best-effort.
        }
      }
    },
  };
  return handle;
}

/**
 * Convenience wrapper — calls `app.server.start()` to bind the HTTP
 * listener (and start the consolidator + triggers daemons through
 * the lifecycle hooks). Returns the same handle so callers can keep
 * driving the cycle programmatically.
 */
export async function startBackgroundConsolidator(
  options: CreateAppOptions = {},
): Promise<BackgroundConsolidatorApp> {
  const app = await createBackgroundConsolidatorApp(options);
  await app.server.start();
  return app;
}

/** Outcome returned by {@link runConsolidatorCycle}. */
export interface RunConsolidatorCycleResult {
  readonly snapshot: ReadonlyArray<import('@graphorin/core').TriggerState>;
  readonly status: ConsolidatorStatus;
  readonly eventCounts: {
    readonly schedulerFires: number;
    readonly schedulerErrors: number;
    readonly consolidatorPhases: { readonly light: number; readonly standard: number };
  };
  readonly turnsDriven: number;
  readonly outcomes: ReadonlyArray<PhaseOutcome>;
}

/** Inputs accepted by {@link runConsolidatorCycle}. */
export interface RunConsolidatorCycleOptions {
  readonly app: BackgroundConsolidatorApp;
  /** Soft budget on how long the cycle is allowed to spend settling. */
  readonly durationMs?: number;
  /** Synthetic turns to drive through the agent. Defaults to 4. */
  readonly turns?: number;
  /**
   * Trigger ids the cycle fires deterministically. Defaults to
   * {@link BACKGROUND_TICK_TRIGGER_ID} so the smoke test does not
   * depend on wall-clock time. Pass `[]` to skip trigger firing.
   */
  readonly fireTriggerIds?: ReadonlyArray<string>;
}

/**
 * Drive a deterministic background-consolidator cycle. Pushes a few
 * synthetic user/assistant turns through the session, fires the
 * registered light-tick interval trigger by id (no wall-clock wait),
 * and returns the trigger snapshot, the consolidator status, and the
 * aggregated event counters. Used by the smoke test; safe to call
 * from operator code as well.
 */
export async function runConsolidatorCycle(
  options: RunConsolidatorCycleOptions,
): Promise<RunConsolidatorCycleResult> {
  const { app } = options;
  const turns = options.turns ?? 4;
  const fireTriggerIds = options.fireTriggerIds ?? [BACKGROUND_TICK_TRIGGER_ID];
  const durationMs = options.durationMs ?? 1_000;

  const phaseCounts = { light: 0, standard: 0 };
  const outcomes: PhaseOutcome[] = [];
  const phaseListener: PhaseListener = (outcome) => {
    outcomes.push(outcome);
    if (outcome.status === 'completed' || outcome.status === 'partial') {
      if (outcome.phase === 'light') phaseCounts.light += 1;
      else if (outcome.phase === 'standard') phaseCounts.standard += 1;
    }
  };
  const unsubscribe = app.memory.consolidator.onPhaseFinished(phaseListener);

  let schedulerFires = 0;
  let schedulerErrors = 0;
  const eventStop = new AbortController();
  const eventPump = (async () => {
    try {
      for await (const ev of app.scheduler.events()) {
        if (eventStop.signal.aborted) break;
        observeSchedulerEvent(ev);
      }
    } catch {
      // Best-effort — the scheduler closes the iterator on stop().
    }
  })();
  function observeSchedulerEvent(ev: SchedulerEvent): void {
    if (ev.type === 'fire-end') schedulerFires += 1;
    else if (ev.type === 'fire-error') schedulerErrors += 1;
  }

  let turnsDriven = 0;
  try {
    for (let i = 0; i < turns; i += 1) {
      const userInput =
        `Turn ${i + 1}: please remember that I prefer concise answers ` +
        `and that this conversation is being consolidated in the background.`;
      await app.session.push({ role: 'user', content: userInput });
      let assistantText = '';
      for await (const ev of app.agent.stream(userInput, {
        sessionId: app.sessionId,
        userId: app.userId,
      }) as AsyncIterable<AgentEvent<string>>) {
        if (ev.type === 'text.delta') assistantText += ev.delta;
        else if (ev.type === 'agent.error') {
          throw new Error(
            `[graphorin/example-background-consolidator] agent failed mid-turn: ` +
              `${ev.error.code} — ${ev.error.message}`,
          );
        }
      }
      if (assistantText.length > 0) {
        await app.session.push({
          role: 'assistant',
          content: assistantText,
          agentId: app.agentId,
        });
      }
      // Notify the consolidator the turn cursor advanced. Turn-based
      // light + standard fire from this path (the scheduler has no
      // way to count user turns autonomously per DEC-150).
      await app.memory.consolidator.trigger({ kind: 'turn', value: i + 1 }, app.scope);
      turnsDriven += 1;
    }

    // Deterministically fire each requested trigger so the smoke
    // test does not depend on `setTimeout` resolution.
    for (const id of fireTriggerIds) {
      try {
        await app.scheduler.fire(id);
      } catch {
        // Trigger missing — best-effort, surfaced in `eventCounts`.
      }
    }

    // Brief settling window — let the (already-resolved) callbacks
    // surface their lifecycle events through the pump above.
    await sleep(Math.min(durationMs, 100));
  } finally {
    eventStop.abort();
    unsubscribe();
    // Drop pending queue subscribers without stopping the scheduler.
    await Promise.race([eventPump, sleep(0)]);
  }

  const snapshot = await app.scheduler.list();
  const status = await app.memory.consolidator.status();
  return {
    snapshot,
    status,
    eventCounts: {
      schedulerFires,
      schedulerErrors,
      consolidatorPhases: { light: phaseCounts.light, standard: phaseCounts.standard },
    },
    turnsDriven,
    outcomes,
  };
}

/**
 * Bridge the production `Consolidator` surface from
 * `@graphorin/memory` to the structural `ConsolidatorLike` surface
 * `@graphorin/server` consumes. The runtime-side `drainDlq(scope)`
 * takes a scope argument; the server-side surface declares
 * `drainDlq()` (no args). The adapter binds the scope so the daemon
 * can pump the DLQ without re-knowing the runtime's shape.
 */
function toConsolidatorLike(
  consolidator: Consolidator,
  scope: SessionScope,
): Parameters<typeof createServer>[0] extends { consolidator?: infer C } ? C : never {
  type ServerConsolidator = Parameters<typeof createServer>[0] extends { consolidator?: infer C }
    ? C
    : never;
  const adapter = {
    async start(): Promise<void> {
      await consolidator.start();
    },
    async stop(): Promise<void> {
      await consolidator.stop();
    },
    async status() {
      return consolidator.status();
    },
    async setTier(tier: string): Promise<void> {
      await consolidator.setTier(tier as ConsolidatorTier);
    },
    async pause(): Promise<void> {
      await consolidator.pause();
    },
    async resume(): Promise<void> {
      await consolidator.resume();
    },
    async drainDlq(): Promise<number> {
      return consolidator.drainDlq(scope);
    },
  };
  return adapter as unknown as ServerConsolidator;
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * CLI entry point. Boots the app against an in-memory SQLite store,
 * runs one cycle, prints the consolidator status, and exits cleanly.
 * The block is gated by `import.meta.url === file:${argv[1]}` so the
 * module is safely importable from tests + downstream consumers.
 */
export async function main(args: { readonly env?: NodeJS.ProcessEnv } = {}): Promise<number> {
  const env = args.env ?? process.env;
  const app = await createBackgroundConsolidatorApp({
    env,
    dbPath: ':memory:',
    lightTickIntervalMs: 60_000,
    idleProbeMs: 30_000,
  });
  try {
    const cycle = await runConsolidatorCycle({ app, durationMs: 200, turns: 4 });
    process.stdout.write(
      `graphorin v${VERSION} background-consolidator — ` +
        `recipe='${app.recipe}', tier='${cycle.status.tier}', ` +
        `running=${cycle.status.running}, ` +
        `turnsDriven=${cycle.turnsDriven}, ` +
        `lightPhases=${cycle.eventCounts.consolidatorPhases.light}, ` +
        `standardPhases=${cycle.eventCounts.consolidatorPhases.standard}, ` +
        `schedulerFires=${cycle.eventCounts.schedulerFires}, ` +
        `triggers=[${cycle.snapshot.map((t) => t.id).join(', ')}].\n`,
    );
    return 0;
  } finally {
    await app.close();
  }
}

// Re-exported surface markers — keep imported builders alive
// through tree-shaking so downstream consumers can import them
// straight from the example barrel as a starter recipe.
void cron;
void interval;
void idle;

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
