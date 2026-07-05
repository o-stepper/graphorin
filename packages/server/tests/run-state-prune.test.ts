/**
 * IP-16: `RunStateTracker.prune()` was never called - terminal run records
 * (each holding an AbortController) accumulated forever on a long-living
 * server. `scheduleRunPruning` is the wired-in periodic sweep.
 */
import { describe, expect, it, vi } from 'vitest';
import { RunStateTracker, scheduleRunPruning } from '../src/runtime/run-state.js';

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
