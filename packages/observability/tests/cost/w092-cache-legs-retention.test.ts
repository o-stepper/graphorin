/**
 * W-092: prompt-cache legs in records + snapshots, bounded internal
 * maps, and the withCostTracking -> CostTracker delegate.
 */
import { describe, expect, it } from 'vitest';
import { costTrackerUsageDelegate, createCostTracker } from '../../src/index.js';

function record(spanId: string, extra: Record<string, unknown> = {}) {
  return {
    model: 'model-a',
    promptTokens: 10,
    completionTokens: 5,
    spanId,
    ...extra,
  } as never;
}

describe('W-092 - cache legs', () => {
  it('aggregates cachedRead/cacheWrite per span, scope and model', () => {
    const tracker = createCostTracker();
    tracker.record(
      record('s1', {
        sessionId: 'sess',
        cachedReadTokens: 100,
        cacheWriteTokens: 20,
      }),
    );
    tracker.record(
      record('s2', {
        sessionId: 'sess',
        parentSpanId: 's1',
        cachedReadTokens: 50,
      }),
    );

    const session = tracker.usage('session', 'sess');
    expect(session.cachedReadTokens).toBe(150);
    expect(session.cacheWriteTokens).toBe(20);
    expect(session.byModel[0]).toMatchObject({
      model: 'model-a',
      cachedReadTokens: 150,
      cacheWriteTokens: 20,
    });
    // Parent rollup carries the cache legs too.
    expect(tracker.usageForSpan('s1').cachedReadTokens).toBe(150);
    // Absent legs default to 0 (snapshot fields are always present).
    const zero = tracker.usage('session', 'unknown');
    expect(zero.cachedReadTokens).toBe(0);
    expect(zero.cacheWriteTokens).toBe(0);
  });
});

describe('W-092 - retention bounds', () => {
  it('evicts the oldest span entries past maxSpanEntries', () => {
    const evicted: Array<{ surface: string; id: string }> = [];
    const tracker = createCostTracker({
      retention: { maxSpanEntries: 3 },
      onEviction: (e) => evicted.push(e),
    });
    for (let i = 1; i <= 5; i += 1) {
      tracker.record(record(`span-${i}`));
    }
    // Oldest two are gone and report ZERO; the freshest are intact.
    expect(tracker.usageForSpan('span-1').callCount).toBe(0);
    expect(tracker.usageForSpan('span-2').callCount).toBe(0);
    expect(tracker.usageForSpan('span-4').callCount).toBe(1);
    expect(tracker.usageForSpan('span-5').callCount).toBe(1);
    expect(evicted.map((e) => e.id)).toEqual(['span-1', 'span-2']);
    // A NEW record naming an evicted ancestor re-creates it from zero
    // (documented behaviour, no throw).
    tracker.record(record('span-6', { parentSpanId: 'span-1' }));
    expect(tracker.usageForSpan('span-1').promptTokens).toBe(10);
  });

  it('evicting a span drops its parent edge (no rollup to a stale ancestor)', () => {
    const tracker = createCostTracker({ retention: { maxSpanEntries: 2 } });
    // child -> parent chain, then flood both out of the map.
    tracker.record(record('parent'));
    tracker.record(record('child', { parentSpanId: 'parent' }));
    tracker.record(record('flood-1'));
    tracker.record(record('flood-2'));
    expect(tracker.usageForSpan('parent').callCount).toBe(0);
    expect(tracker.usageForSpan('child').callCount).toBe(0);
    // Re-recording the child WITHOUT a parent must not resurrect the
    // old edge - the parent stays zero.
    tracker.record(record('child'));
    expect(tracker.usageForSpan('child').callCount).toBe(1);
    expect(tracker.usageForSpan('parent').callCount).toBe(0);
  });

  it('bounds each scope map independently', () => {
    const tracker = createCostTracker({ retention: { maxScopeEntries: 2 } });
    tracker.record(record('a', { runId: 'r1' }));
    tracker.record(record('b', { runId: 'r2' }));
    tracker.record(record('c', { runId: 'r3' }));
    expect(tracker.usage('run', 'r1').callCount).toBe(0);
    expect(tracker.usage('run', 'r2').callCount).toBe(1);
    expect(tracker.usage('run', 'r3').callCount).toBe(1);
  });

  it('retention: false restores the unbounded behaviour', () => {
    const tracker = createCostTracker({ retention: false });
    for (let i = 0; i < 12_000; i += 1) {
      tracker.record(record(`span-${i}`));
    }
    expect(tracker.usageForSpan('span-0').callCount).toBe(1);
    expect(tracker.usageForSpan('span-11999').callCount).toBe(1);
  });
});

describe('W-092 - withCostTracking delegate', () => {
  it('converts the onUsage info (incl. cache legs + USD cost) into a record', () => {
    const tracker = createCostTracker();
    const onUsage = costTrackerUsageDelegate(tracker, { spanId: 'sp', sessionId: 'sess' });
    onUsage({
      modelId: 'claude-x',
      promptTokens: 100,
      completionTokens: 40,
      cachedReadTokens: 60,
      cacheWriteTokens: 10,
      costUsd: 0.012,
    });
    const snap = tracker.usage('session', 'sess');
    expect(snap.promptTokens).toBe(100);
    expect(snap.cachedReadTokens).toBe(60);
    expect(snap.cacheWriteTokens).toBe(10);
    expect(snap.cost).toEqual({ amount: 0.012, currency: 'USD' });
    expect(snap.byModel[0]?.model).toBe('claude-x');
  });

  it('a zero costUsd records tokens WITHOUT fabricating a $0 cost', () => {
    const tracker = createCostTracker();
    const onUsage = costTrackerUsageDelegate(tracker, () => ({ spanId: 'sp', runId: 'r' }));
    onUsage({ modelId: 'm', promptTokens: 5, completionTokens: 1, costUsd: 0 });
    const snap = tracker.usage('run', 'r');
    expect(snap.promptTokens).toBe(5);
    expect(snap.cost).toBeNull();
  });
});
