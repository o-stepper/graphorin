/**
 * IP-16: `RunStateTracker.prune()` was never called - terminal run records
 * (each holding an AbortController) accumulated forever on a long-living
 * server. `scheduleRunPruning` is the wired-in periodic sweep.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  RunStateTracker,
  scheduleIdempotencyPruning,
  scheduleRunPruning,
} from '../src/runtime/run-state.js';

const agentDesc = { kind: 'agent', agentId: 'a' } as const;

describe('IP-16: scheduled run-state pruning', () => {
  it('prunes terminal records older than retention on the timer; keeps active runs', () => {
    vi.useFakeTimers();
    try {
      let t = 1_000_000;
      const now = (): number => t;
      const runs = new RunStateTracker({ now });
      runs.start('old', agentDesc);
      runs.complete('old', 'completed'); // completedAt = 1_000_000
      runs.start('live', agentDesc); // running - no completedAt
      // Advance wall-clock well past the retention window.
      t = 1_000_000 + 60_000 + 10_000;
      const stop = scheduleRunPruning(runs, now, { intervalMs: 1_000, retentionMs: 60_000 });
      vi.advanceTimersByTime(1_000);
      expect(runs.snapshot('old')).toBeUndefined(); // terminal + old → pruned
      expect(runs.snapshot('live')).toBeDefined(); // running → kept
      stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('the returned stop() halts further pruning', () => {
    vi.useFakeTimers();
    try {
      let t = 1_000_000;
      const now = (): number => t;
      const runs = new RunStateTracker({ now });
      const stop = scheduleRunPruning(runs, now, { intervalMs: 1_000, retentionMs: 60_000 });
      stop();
      runs.start('old', agentDesc);
      runs.complete('old', 'completed');
      t = 1_000_000 + 60_000 + 10_000;
      vi.advanceTimersByTime(5_000);
      expect(runs.snapshot('old')).toBeDefined(); // timer cleared → never pruned
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('W-061: scheduled idempotency-record pruning', () => {
  it('calls store.prune(now()) on every tick and stops with the stop function', () => {
    vi.useFakeTimers();
    try {
      let t = 5_000;
      const now = (): number => t;
      const cutoffs: number[] = [];
      const store = {
        async prune(olderThan: number): Promise<number> {
          cutoffs.push(olderThan);
          return 0;
        },
      };
      const stop = scheduleIdempotencyPruning(store, now, { intervalMs: 1_000 });
      vi.advanceTimersByTime(1_000);
      t = 6_000;
      vi.advanceTimersByTime(1_000);
      // Each tick sweeps exactly the already-expired records: cutoff = now().
      expect(cutoffs).toEqual([5_000, 6_000]);
      stop();
      vi.advanceTimersByTime(5_000);
      expect(cutoffs).toEqual([5_000, 6_000]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('swallows store errors (best-effort sweep)', async () => {
    vi.useFakeTimers();
    try {
      const store = {
        async prune(): Promise<number> {
          throw new Error('db locked');
        },
      };
      const stop = scheduleIdempotencyPruning(store, () => 1, { intervalMs: 100 });
      vi.advanceTimersByTime(350);
      // Flush the rejected promises created by the ticks.
      await vi.runAllTicks();
      stop();
      // Reaching here without an unhandled rejection is the assertion.
      expect(true).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
