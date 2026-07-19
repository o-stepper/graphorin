/**
 * The unified server-side retention scheduler.
 *
 * Every prune primitive in the store layer used to be manual and
 * disconnected (CLI-only, API-only, or - like the idempotency sweep
 * once was - dead code). This module owns ONE periodic sweep over
 * every SQLite growth surface, driven by the `config.retention`
 * section. Policy: derived / recoverable data (span telemetry,
 * consolidator run counters, exhausted DLQ batches, expired
 * idempotency bodies) is pruned by default with conservative windows;
 * primary user content (sessions, memory history, workflow threads,
 * session audit) is strictly opt-in via an explicit `*Days` window.
 *
 * UNITS TABLE - the primitives do NOT share cutoff semantics, and
 * conflating them produces silent no-ops, not errors:
 *
 * | surface                        | argument                  | unit          |
 * | ------------------------------ | ------------------------- | ------------- |
 * | spans (pruneSpans)             | `{ beforeEpochMs }`       | epoch ms      |
 * | consolidator runs (pruneRuns)  | `beforeEpochMs`           | epoch ms      |
 * | DLQ (pruneExhaustedBatches)    | `beforeEpochMs`           | epoch ms      |
 * | idempotency (prune)            | `now()`                   | epoch ms, compared to `expires_at` |
 * | sessions (pruneSessions)       | `{ beforeEpochMs, closedOnly }` | epoch ms |
 * | session audit (pruneAuditEntries) | `beforeEpochMs`        | epoch ms      |
 * | memory history (pruneHistory)  | `olderThanMs`             | AGE in ms - the store computes `Date.now() - olderThanMs` itself; passing an epoch cutoff here would resolve to a cutoff near 1970 and delete nothing |
 * | workflow threads (pruneThreads) | `{ beforeEpochMs, onlyTerminal: true }` | epoch ms |
 *
 * The file-based replay-JSONL directory (`@graphorin/observability`
 * `pruneTraces`) is deliberately NOT swept here: it is a filesystem
 * surface, not a SQLite one - schedule it via cron (see the
 * deployment guide).
 *
 * @packageDocumentation
 */

import { pruneSpans, type SqliteConnection } from '@graphorin/store-sqlite';

const DAY_MS = 86_400_000;

/**
 * Mirror of the `config.retention` section of
 * `ServerConfigSpec`.
 *
 * @stable
 */
export interface RetentionConfig {
  readonly enabled: boolean;
  readonly intervalMs: number;
  readonly spansDays: number;
  readonly consolidatorRunsDays: number;
  readonly dlqExhaustedDays: number;
  readonly idempotency: boolean;
  readonly sessionsDays?: number;
  readonly sessionsClosedOnly: boolean;
  readonly memoryHistoryDays?: number;
  readonly workflowThreadsDays?: number;
  readonly auditDays?: number;
}

/**
 * Structural slice of `GraphorinSqliteStore` the sweep consumes. Typed
 * structurally so custom store implementations (and test fakes) work;
 * a surface whose method is absent is skipped, never an error.
 *
 * @stable
 */
export interface RetentionStoreLike {
  readonly connection: SqliteConnection;
  readonly sessions: {
    pruneSessions(opts: {
      readonly beforeEpochMs?: number;
      readonly closedOnly?: boolean;
    }): Promise<number>;
    pruneAuditEntries(beforeEpochMs: number): Promise<number>;
  };
  readonly memory: {
    pruneHistory(olderThanMs: number): Promise<number>;
  };
  readonly checkpoints: {
    pruneThreads(opts: {
      readonly beforeEpochMs: number;
      readonly onlyTerminal?: boolean;
    }): Promise<number>;
  };
  readonly idempotency: {
    prune(olderThan: number): Promise<number>;
  };
}

/** @stable */
export type RetentionLogLevel = 'info' | 'warn';

/**
 * Logging seam: `warn` on a failed surface, `info` with per-surface
 * deletion counts after each sweep. Defaults to a no-op.
 *
 * @stable
 */
export type RetentionLog = (
  level: RetentionLogLevel,
  message: string,
  fields?: Record<string, unknown>,
) => void;

/** @stable */
export interface ScheduleRetentionOptions {
  readonly store: RetentionStoreLike;
  readonly config: RetentionConfig;
  readonly now: () => number;
  readonly log?: RetentionLog;
  /**
   * Test seam for the span sweep (the real one issues SQL against
   * `store.connection`).
   *
   * @internal
   */
  readonly pruneSpansImpl?: (
    conn: SqliteConnection,
    opts: { readonly beforeEpochMs: number },
  ) => number;
}

/**
 * Console-backed {@link RetentionLog} honouring the
 * `observability.logger` config flavour. Returns `undefined` for
 * `'silent'` so callers can pass the result straight through.
 *
 * @stable
 */
export function createConsoleRetentionLog(
  flavour: 'json' | 'pretty' | 'silent',
): RetentionLog | undefined {
  if (flavour === 'silent') return undefined;
  return (level, message, fields) => {
    const sink = level === 'warn' ? console.warn : console.log;
    if (flavour === 'json') {
      sink(JSON.stringify({ level, component: 'retention', message, ...fields }));
      return;
    }
    sink(
      `[retention] ${level}: ${message}${fields !== undefined ? ` ${JSON.stringify(fields)}` : ''}`,
    );
  };
}

/**
 * Consolidator state lives on `SqliteMemoryStore.consolidator`, not on
 * the `GraphorinSqliteStore` facade. Detected structurally (rather than
 * via `instanceof SqliteMemoryStore`) so compatible custom stores get
 * the sweep too and stores without the surface simply skip it.
 */
interface ConsolidatorPruneLike {
  pruneRuns(beforeEpochMs: number): Promise<number>;
  pruneExhaustedBatches(beforeEpochMs: number): Promise<number>;
}

function consolidatorOf(store: RetentionStoreLike): ConsolidatorPruneLike | undefined {
  const candidate = (store.memory as { consolidator?: Partial<ConsolidatorPruneLike> })
    .consolidator;
  if (
    candidate !== undefined &&
    typeof candidate.pruneRuns === 'function' &&
    typeof candidate.pruneExhaustedBatches === 'function'
  ) {
    return candidate as ConsolidatorPruneLike;
  }
  return undefined;
}

/**
 * Schedule the periodic retention sweep. Same lifecycle shape
 * as `scheduleRunPruning`: `unref`-ed `setInterval` + a stop function.
 * The FIRST sweep runs immediately on scheduling - a server that is
 * restarted more often than `intervalMs` would otherwise never prune
 * anything. Each surface is isolated in its own try/catch: one failing
 * prune logs a WARN and never blocks the others. Overlapping sweeps
 * are skipped (the previous sweep still running when the timer fires
 * again is a signal the interval is too tight, not a reason to pile
 * up writers).
 *
 * Returns a stop function; with `config.enabled === false` no timer is
 * created and the stop function is a no-op.
 *
 * @stable
 */
export function scheduleRetentionSweeps(options: ScheduleRetentionOptions): () => void {
  const { store, config, now } = options;
  if (!config.enabled) return () => {};
  const log: RetentionLog = options.log ?? (() => {});
  const pruneSpansImpl = options.pruneSpansImpl ?? pruneSpans;
  const consolidator = consolidatorOf(store);

  let sweeping = false;
  let stopped = false;

  const sweep = async (): Promise<void> => {
    if (sweeping) return;
    sweeping = true;
    const counts: Record<string, number> = {};
    const runSurface = async (surface: string, prune: () => Promise<number>): Promise<void> => {
      // The immediate startup sweep can outlive a fast stop() (tests,
      // tight restart loops); the store may already be closed then, so
      // bail between surfaces instead of warning on every one.
      if (stopped) return;
      try {
        counts[surface] = await prune();
      } catch (err) {
        if (stopped) return;
        log('warn', `retention sweep failed for ${surface}`, {
          surface,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };
    try {
      const t = now();
      // Derived / recoverable surfaces - on by default.
      await runSurface('spans', () =>
        Promise.resolve(
          pruneSpansImpl(store.connection, { beforeEpochMs: t - config.spansDays * DAY_MS }),
        ),
      );
      if (consolidator !== undefined) {
        await runSurface('consolidatorRuns', () =>
          consolidator.pruneRuns(t - config.consolidatorRunsDays * DAY_MS),
        );
        await runSurface('dlqExhausted', () =>
          consolidator.pruneExhaustedBatches(t - config.dlqExhaustedDays * DAY_MS),
        );
      }
      if (config.idempotency) {
        // Compared against expires_at: pass the CURRENT moment, not a window.
        await runSurface('idempotency', () => store.idempotency.prune(t));
      }
      // Primary content - strictly opt-in via an explicit window.
      if (config.sessionsDays !== undefined) {
        const days = config.sessionsDays;
        await runSurface('sessions', () =>
          store.sessions.pruneSessions({
            beforeEpochMs: t - days * DAY_MS,
            closedOnly: config.sessionsClosedOnly,
          }),
        );
      }
      if (config.auditDays !== undefined) {
        const days = config.auditDays;
        await runSurface('sessionAudit', () => store.sessions.pruneAuditEntries(t - days * DAY_MS));
      }
      if (config.memoryHistoryDays !== undefined) {
        // AGE in ms, NOT an epoch cutoff - see the units table above.
        const days = config.memoryHistoryDays;
        await runSurface('memoryHistory', () => store.memory.pruneHistory(days * DAY_MS));
      }
      if (config.workflowThreadsDays !== undefined) {
        const days = config.workflowThreadsDays;
        await runSurface('workflowThreads', () =>
          store.checkpoints.pruneThreads({
            beforeEpochMs: t - days * DAY_MS,
            onlyTerminal: true,
          }),
        );
      }
      // Quiet on a no-op sweep (fresh DBs, tight restart loops): the
      // INFO line only appears when the sweep actually deleted rows.
      if (!stopped && Object.values(counts).some((n) => n > 0)) {
        log('info', 'retention sweep complete', counts);
      }
    } finally {
      sweeping = false;
    }
  };

  void sweep();
  const timer = setInterval(() => {
    void sweep();
  }, config.intervalMs);
  if (typeof (timer as { unref?: () => void }).unref === 'function') {
    (timer as { unref: () => void }).unref();
  }
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
