import { describe, expect, it } from 'vitest';
import {
  incrementCounter,
  resetCountersForTesting,
  setGauge,
  snapshotCounters,
} from '../src/audit/index.js';

describe('W-051 - CounterSnapshot.kinds', () => {
  it('marks incremented keys as counters and set keys as gauges', () => {
    resetCountersForTesting();
    try {
      incrementCounter('tool.executor.retry.total', { toolName: 'x' });
      setGauge('tool.result.truncation.first-overrun', 1, { toolName: 'x' });
      const snap = snapshotCounters();
      expect(snap.kinds['tool.executor.retry.total{toolName=x}']).toBe('counter');
      expect(snap.kinds['tool.result.truncation.first-overrun{toolName=x}']).toBe('gauge');
      // Kinds mirror the counters keys exactly.
      expect(Object.keys(snap.kinds).sort()).toEqual(Object.keys(snap.counters).sort());
    } finally {
      resetCountersForTesting();
    }
    expect(Object.keys(snapshotCounters().kinds)).toHaveLength(0);
  });
});
