/**
 * Lifecycle wrapper around an externally-built `Consolidator`. Phase
 * 14c wires the runtime into `beforeStart` / `beforeShutdown` so the
 * background pipeline starts and stops cleanly with the daemon. The
 * adapter does not own the consolidator construction - operators
 * supply the instance through the `createServer({ consolidator })`
 * option so the framework stays decoupled from the heavy
 * `@graphorin/memory` package.
 *
 * @packageDocumentation
 */

/**
 * Structurally-typed view of the `@graphorin/memory` Consolidator
 * surface. Importing the full type would force a hard dependency on
 * `@graphorin/memory`; the structural subset captured here is enough
 * for the lifecycle integration + the `/v1/health` aggregator.
 *
 * @stable
 */
export interface ConsolidatorLike {
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<ConsolidatorStatusLike>;
  setTier?(tier: string): Promise<void>;
  pause?(): Promise<void>;
  resume?(): Promise<void>;
  drainDlq?(): Promise<number>;
  /**
   * Register the consolidator's cron / idle triggers with the server's
   * triggers scheduler so background consolidation actually fires.
   * Called from `beforeStart` when both a consolidator and a triggers daemon
   * are configured. Optional so a consolidator without a `defaultScope` (or a
   * custom surface) simply opts out.
   */
  registerWithScheduler?(scheduler: import('@graphorin/triggers').Scheduler): Promise<unknown>;
  /**
   * Activity signal - a tracked run settled, the
   * transcript may have grown. The server's run tracker calls this so
   * a configured `buffer:N` trigger is re-evaluated against the
   * unconsolidated tail. Optional: older consolidator surfaces simply
   * opt out.
   */
  notifyActivity?(): Promise<unknown>;
}

/**
 * Subset of `ConsolidatorStatus` the server health endpoint and the
 * Prometheus metrics consume. The full struct lives in
 * `@graphorin/memory/consolidator`.
 *
 * @stable
 */
export interface ConsolidatorStatusLike {
  readonly tier: string;
  readonly running: boolean;
  readonly paused: boolean;
  readonly queueDepth: number;
  readonly dlqSize: number;
  readonly deferredRuns: number;
  readonly emptyExtractions: number;
  readonly budget: {
    readonly tokensUsedToday: number;
    readonly costUsedToday: number;
    readonly tokensRemaining: number;
    readonly costRemaining: number;
    readonly resetAt: string;
  };
}

/**
 * @stable
 */
export interface CreateConsolidatorDaemonOptions {
  readonly consolidator: ConsolidatorLike;
  /** Hard timeout on `consolidator.stop()`. Defaults to 10 s. */
  readonly stopTimeoutMs?: number;
  readonly warn?: (message: string) => void;
}

/**
 * @stable
 */
export interface ConsolidatorDaemon {
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<ConsolidatorStatusLike>;
  readonly consolidator: ConsolidatorLike;
}

/**
 * @stable
 */
export function createConsolidatorDaemon(
  options: CreateConsolidatorDaemonOptions,
): ConsolidatorDaemon {
  const stopTimeoutMs = options.stopTimeoutMs ?? 10_000;
  const warn = options.warn ?? ((m: string) => process.stderr.write(`${m}\n`));
  let started = false;

  return {
    get consolidator() {
      return options.consolidator;
    },
    async start() {
      if (started) return;
      started = true;
      await options.consolidator.start();
    },
    async stop() {
      if (!started) return;
      started = false;
      try {
        await withTimeout(options.consolidator.stop(), stopTimeoutMs);
      } catch (err) {
        warn(
          `[graphorin/server] consolidator daemon: stop() exceeded ${stopTimeoutMs}ms; force-aborting (${describeError(err)}).`,
        );
      }
    },
    async status() {
      return options.consolidator.status();
    },
  };
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`timeout after ${ms}ms`));
    }, ms);
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function describeError(err: unknown): string {
  if (err === null || err === undefined) return 'unknown';
  if (err instanceof Error) return err.message;
  return String(err);
}
