/**
 * Trigger scheduler integration with the server lifecycle.
 *
 * The daemon wraps a `Scheduler` from `@graphorin/triggers` and binds
 * its `start()` / `stop()` calls to the `beforeStart` / `beforeShutdown`
 * lifecycle hooks. On `start()`, every persisted trigger is loaded
 * from `trigger_state` (durable) and the per-trigger `catchupPolicy`
 * is honoured so cron / interval / idle / event triggers survive
 * process restarts as documented in the runtime spec.
 *
 * The daemon never invokes user callbacks itself — those run inside
 * the `Scheduler`. The daemon only owns lifecycle + observability.
 *
 * @packageDocumentation
 */

import type { CatchupPolicy, Scheduler, SchedulerEvent } from '@graphorin/triggers';

/**
 * Snapshot exposed via {@link TriggersDaemon.status} + the
 * `/v1/health` aggregator. Counts split by `disabled` so the health
 * endpoint can flag a deployment that disabled every cron trigger.
 *
 * @stable
 */
export interface TriggersDaemonStatus {
  readonly running: boolean;
  readonly active: number;
  readonly disabled: number;
  readonly deferred: number;
  /** Last fire timestamp across the entire pool (ISO-8601). */
  readonly lastFireAt?: string;
}

/**
 * Aggregate counters surfaced through the Prometheus
 * `/v1/metrics` exposition. Updated incrementally as the scheduler
 * publishes lifecycle events.
 *
 * @stable
 */
export interface TriggersDaemonMetrics {
  readonly fires: ReadonlyMap<string, { readonly success: number; readonly error: number }>;
  readonly catchupApplied: number;
  readonly libModeWarnings: number;
}

/**
 * @stable
 */
export interface CreateTriggersDaemonOptions {
  readonly scheduler: Scheduler;
  /**
   * Optional logger. Defaults to the standard error stream so the
   * daemon never depends on the framework logger directly.
   */
  readonly warn?: (message: string) => void;
}

/**
 * Stateful handle returned by {@link createTriggersDaemon}. The
 * `start()` / `stop()` methods are wired into
 * `LifecycleHooks.beforeStart` / `beforeShutdown` by `createServer`.
 *
 * @stable
 */
export interface TriggersDaemon {
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<TriggersDaemonStatus>;
  metrics(): TriggersDaemonMetrics;
  readonly scheduler: Scheduler;
}

/**
 * @stable
 */
export function createTriggersDaemon(options: CreateTriggersDaemonOptions): TriggersDaemon {
  const fires = new Map<string, { success: number; error: number }>();
  let catchupApplied = 0;
  let libModeWarnings = 0;
  let lastFireAtMs: number | undefined;
  let running = false;
  let pump: Promise<void> | undefined;

  const warn = options.warn ?? ((m: string) => process.stderr.write(`${m}\n`));

  function recordFire(id: string, kind: 'success' | 'error'): void {
    const entry = fires.get(id) ?? { success: 0, error: 0 };
    entry[kind] += 1;
    fires.set(id, entry);
    lastFireAtMs = Date.now();
  }

  async function pumpEvents(): Promise<void> {
    try {
      for await (const event of options.scheduler.events()) {
        observe(event);
      }
    } catch (err) {
      warn(`[graphorin/server] triggers daemon event pump aborted: ${describeError(err)}`);
    }
  }

  function observe(event: SchedulerEvent): void {
    switch (event.type) {
      case 'fire-end':
        recordFire(event.id, 'success');
        return;
      case 'fire-error':
        recordFire(event.id, 'error');
        warn(
          `[graphorin/server] triggers daemon: trigger '${event.id}' failed after ${event.durationMs}ms: ${describeError(event.error)}`,
        );
        return;
      case 'catchup-applied':
        catchupApplied += event.missed;
        return;
      case 'lib-mode-warning':
        libModeWarnings += 1;
        return;
      default:
        return;
    }
  }

  return {
    get scheduler() {
      return options.scheduler;
    },
    async start() {
      if (running) return;
      running = true;
      pump = pumpEvents();
      await options.scheduler.start();
    },
    async stop() {
      if (!running) return;
      running = false;
      await options.scheduler.stop();
      if (pump !== undefined) {
        try {
          await pump;
        } catch {
          // Best-effort during stop().
        }
        pump = undefined;
      }
    },
    async status() {
      const all = await options.scheduler.list();
      let active = 0;
      let disabled = 0;
      let deferred = 0;
      for (const t of all) {
        if (t.disabled) disabled += 1;
        else active += 1;
        if (t.missedFires > 0) deferred += 1;
      }
      const out: {
        -readonly [K in keyof TriggersDaemonStatus]?: TriggersDaemonStatus[K];
      } = {
        running,
        active,
        disabled,
        deferred,
      };
      if (lastFireAtMs !== undefined) {
        out.lastFireAt = new Date(lastFireAtMs).toISOString();
      }
      return Object.freeze(out as TriggersDaemonStatus);
    },
    metrics() {
      return Object.freeze({
        fires: new Map(fires),
        catchupApplied,
        libModeWarnings,
      });
    },
  };
}

/**
 * Resolve the catch-up policy default for triggers that did not
 * declare one explicitly. Returns `'none'` per DEC-150 (personal-
 * assistant friendly).
 *
 * @stable
 */
export function defaultCatchupPolicy(): CatchupPolicy {
  return 'none';
}

function describeError(err: unknown): string {
  if (err === null || err === undefined) return 'unknown';
  if (err instanceof Error) return err.message;
  return String(err);
}
