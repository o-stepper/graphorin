/**
 * The durable-timer polling driver. `sleepUntil`/`sleepFor`
 * persist a `wakeAt` and `workflow.tick(threadId)` fires a due timer -
 * but until this module nothing in the framework CALLED tick, so a
 * thread sleeping for 24h slept forever unless the operator built a
 * timer service. The driver polls each workflow's checkpoint store for
 * due suspended threads (`CheckpointStore.listSuspended`, stamped by
 * the engine's `metadata.wakeAt`) and ticks them; the server wraps it
 * in a lifecycle daemon, and library-mode callers run it directly.
 *
 * Deterministic by construction: injectable clock and timers (offline
 * tests), per-thread error isolation, and a typed error - never a
 * silent no-op - when a store cannot enumerate suspended threads.
 *
 * @packageDocumentation
 */

import type { CheckpointStore } from '@graphorin/core';
import { WorkflowError } from './errors/index.js';
import { namespaceFor } from './internal/engine.js';

/** The slice of {@link Workflow} the driver needs (structural). */
export interface TickableWorkflow {
  readonly name: string;
  tick(
    threadId: string,
    opts?: { readonly now?: number },
  ): Promise<{ readonly fired: boolean; readonly nextWakeAt: number | null }>;
}

/** One workflow the driver polls, paired with its checkpoint store. */
export interface TimerDriverEntry {
  readonly workflow: TickableWorkflow;
  readonly checkpointStore: CheckpointStore;
}

/**
 * Thrown by {@link createTimerDriver} when an entry's checkpoint store
 * does not implement the optional `listSuspended` - a driver that
 * silently skipped such stores would look healthy while every timer
 * sleeps forever.
 *
 * @stable
 */
export class TimerDriverStoreUnsupportedError extends WorkflowError {
  readonly workflowName: string;
  constructor(workflowName: string, storeName: string) {
    super(
      'timer-driver-store-unsupported',
      `Timer driver cannot poll workflow '${workflowName}': its checkpoint store (${storeName}) does not implement listSuspended(). Use @graphorin/store-sqlite's checkpoint store or the InMemoryCheckpointStore, or implement the optional method on your custom store.`,
    );
    this.name = 'TimerDriverStoreUnsupportedError';
    this.workflowName = workflowName;
  }
}

/** @stable */
export interface CreateTimerDriverOptions {
  readonly workflows: ReadonlyArray<TimerDriverEntry>;
  /** Poll interval upper bound (ms). Default 30000. */
  readonly pollIntervalMs?: number;
  /** Max due threads ticked per workflow per sweep. Default 100. */
  readonly batchLimit?: number;
  /** Injectable clock (offline tests). Default `Date.now`. */
  readonly now?: () => number;
  readonly setTimeoutImpl?: (fn: () => void, ms: number) => unknown;
  readonly clearTimeoutImpl?: (handle: unknown) => void;
  /**
   * Per-thread failure sink; the driver survives and moves on. A
   * `checkpoint-version-conflict` never reaches it - in a
   * multi-process deployment two drivers may race the same due thread
   * and the store CAS makes the loser benign by design.
   */
  readonly onError?: (workflowName: string, threadId: string, error: unknown) => void;
}

/** @stable */
export interface TimerDriverStatus {
  readonly running: boolean;
  readonly sweeps: number;
  readonly fired: number;
  readonly errors: number;
  readonly lastSweepAt?: number;
  readonly nextWakeAt?: number;
}

/**
 * Handle returned by {@link createTimerDriver}.
 *
 * @stable
 */
export interface TimerDriver {
  start(): void;
  stop(): void;
  status(): TimerDriverStatus;
  /** Run one poll pass immediately; resolves with the fired count. */
  sweep(): Promise<number>;
}

function isBenignConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { readonly name?: unknown; readonly code?: unknown };
  return e.name === 'CheckpointConflictError' || e.code === 'checkpoint-version-conflict';
}

/**
 * Build a polling driver over the supplied workflows. Call
 * `start()` to begin polling; the next pass is scheduled at
 * `min(pollIntervalMs, earliest nextWakeAt)` so a short timer does not
 * wait out a long poll interval.
 *
 * @stable
 */
export function createTimerDriver(options: CreateTimerDriverOptions): TimerDriver {
  const pollIntervalMs = options.pollIntervalMs ?? 30_000;
  const batchLimit = options.batchLimit ?? 100;
  const now = options.now ?? Date.now;
  const setT = options.setTimeoutImpl ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearT =
    options.clearTimeoutImpl ??
    ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));

  const entries = options.workflows.map((entry) => {
    if (typeof entry.checkpointStore.listSuspended !== 'function') {
      throw new TimerDriverStoreUnsupportedError(
        entry.workflow.name,
        entry.checkpointStore.constructor?.name ?? 'unknown store',
      );
    }
    return {
      workflow: entry.workflow,
      store: entry.checkpointStore,
      namespace: namespaceFor({ name: entry.workflow.name }),
    };
  });

  let running = false;
  let sweeps = 0;
  let firedTotal = 0;
  let errors = 0;
  let lastSweepAt: number | undefined;
  let nextWakeAt: number | undefined;
  let handle: unknown;
  let inFlight: Promise<number> | undefined;

  async function sweepOnce(): Promise<number> {
    const at = now();
    lastSweepAt = at;
    sweeps += 1;
    let fired = 0;
    let earliestNext: number | undefined;
    // WORKFLOW-01: look one poll interval ahead. A thread whose timer is not
    // yet due contributes its wakeAt to `earliestNext`, so `schedule()`
    // re-arms at min(pollIntervalMs, earliest wakeAt) instead of waiting out
    // the full interval - a short durable timer used to sleep until the next
    // poll tick because only ALREADY-DUE threads set earliestNext.
    const lookahead = at + pollIntervalMs;
    for (const entry of entries) {
      let suspended: ReadonlyArray<{ readonly threadId: string; readonly wakeAt: number }>;
      try {
        suspended =
          (await entry.store.listSuspended?.(entry.namespace, {
            dueBefore: lookahead,
            limit: batchLimit,
          })) ?? [];
      } catch (error) {
        errors += 1;
        options.onError?.(entry.workflow.name, '(listSuspended)', error);
        continue;
      }
      for (const item of suspended) {
        // Not yet due: only inform the next wake-up, do not tick it early.
        if (item.wakeAt > at) {
          earliestNext =
            earliestNext === undefined ? item.wakeAt : Math.min(earliestNext, item.wakeAt);
          continue;
        }
        try {
          const result = await entry.workflow.tick(item.threadId, { now: now() });
          if (result.fired) fired += 1;
          if (result.nextWakeAt !== null) {
            earliestNext =
              earliestNext === undefined
                ? result.nextWakeAt
                : Math.min(earliestNext, result.nextWakeAt);
          }
        } catch (error) {
          if (isBenignConflict(error)) continue;
          errors += 1;
          options.onError?.(entry.workflow.name, item.threadId, error);
        }
      }
    }
    firedTotal += fired;
    nextWakeAt = earliestNext;
    return fired;
  }

  function schedule(): void {
    if (!running) return;
    const base = now();
    const target =
      nextWakeAt !== undefined
        ? Math.min(base + pollIntervalMs, nextWakeAt)
        : base + pollIntervalMs;
    const delay = Math.max(25, target - base);
    handle = setT(() => {
      void runPass();
    }, delay);
    // Never hold the process open just for polling.
    (handle as { unref?: () => void } | null)?.unref?.();
  }

  async function runPass(): Promise<void> {
    if (!running) return;
    inFlight = sweepOnce();
    try {
      await inFlight;
    } finally {
      inFlight = undefined;
      schedule();
    }
  }

  return {
    start(): void {
      if (running) return;
      running = true;
      // First sweep immediately: a rarely-restarted server with a long
      // interval must not leave due timers sleeping until the first tick.
      handle = setT(() => {
        void runPass();
      }, 0);
      (handle as { unref?: () => void } | null)?.unref?.();
    },
    stop(): void {
      running = false;
      if (handle !== undefined) {
        clearT(handle);
        handle = undefined;
      }
    },
    status(): TimerDriverStatus {
      return {
        running,
        sweeps,
        fired: firedTotal,
        errors,
        ...(lastSweepAt !== undefined ? { lastSweepAt } : {}),
        ...(nextWakeAt !== undefined ? { nextWakeAt } : {}),
      };
    },
    async sweep(): Promise<number> {
      if (inFlight !== undefined) return inFlight;
      inFlight = sweepOnce();
      try {
        return await inFlight;
      } finally {
        inFlight = undefined;
      }
    },
  };
}
