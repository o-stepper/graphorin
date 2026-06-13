import { describe, expect, it } from 'vitest';

import { createCostTracker } from '../../src/cost/index.js';

describe('@graphorin/observability/cost — createCostTracker', () => {
  it('rolls up tokens and cost per session', () => {
    const tracker = createCostTracker();
    tracker.record({
      spanId: 's1',
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      cost: { amount: 0.5, currency: 'USD' },
      sessionId: 'sess-1',
    });
    tracker.record({
      spanId: 's2',
      model: 'gpt-4o',
      promptTokens: 30,
      completionTokens: 70,
      cost: { amount: 0.25, currency: 'USD' },
      sessionId: 'sess-1',
    });
    const usage = tracker.usage('session', 'sess-1');
    expect(usage.totalTokens).toBe(250);
    expect(usage.callCount).toBe(2);
    expect(usage.cost?.amount).toBeCloseTo(0.75);
    expect(usage.mixedCurrency).toBe(false); // single currency
    expect(usage.byModel).toHaveLength(1);
    expect(usage.byModel[0]?.model).toBe('gpt-4o');
  });

  it('RP-22: flags mixed-currency aggregation instead of silently overwriting the currency', () => {
    const tracker = createCostTracker();
    tracker.record({
      spanId: 's1',
      model: 'm',
      promptTokens: 1,
      completionTokens: 1,
      cost: { amount: 1, currency: 'USD' },
      sessionId: 'mix',
    });
    tracker.record({
      spanId: 's2',
      model: 'm',
      promptTokens: 1,
      completionTokens: 1,
      cost: { amount: 1, currency: 'EUR' },
      sessionId: 'mix',
    });
    const usage = tracker.usage('session', 'mix');
    expect(usage.mixedCurrency).toBe(true); // pre-RP-22 this silently summed
    expect(usage.cost?.currency).toBe('USD'); // first currency kept, not overwritten by EUR
    expect(usage.byModel[0]?.mixedCurrency).toBe(true);
  });

  it('rolls up across nested parent-child spans', () => {
    const tracker = createCostTracker();
    tracker.record({
      spanId: 'child-1',
      parentSpanId: 'parent',
      model: 'gpt-4o',
      promptTokens: 10,
      completionTokens: 20,
      cost: { amount: 0.1, currency: 'USD' },
    });
    tracker.record({
      spanId: 'child-2',
      parentSpanId: 'parent',
      model: 'gpt-4o',
      promptTokens: 20,
      completionTokens: 30,
      cost: { amount: 0.2, currency: 'USD' },
    });
    const parent = tracker.usageForSpan('parent');
    expect(parent.callCount).toBe(2);
    expect(parent.totalTokens).toBe(80);
    expect(parent.cost?.amount).toBeCloseTo(0.3);
  });

  it('rolls up to ancestors known at record time', () => {
    const tracker = createCostTracker();
    // Edges established before the leaf is recorded so the rollup
    // walks the full chain leaf -> middle -> root.
    tracker.record({
      spanId: 'middle',
      parentSpanId: 'root',
      model: 'm',
      promptTokens: 0,
      completionTokens: 0,
    });
    tracker.record({
      spanId: 'leaf',
      parentSpanId: 'middle',
      model: 'm',
      promptTokens: 5,
      completionTokens: 5,
    });
    const root = tracker.usageForSpan('root');
    expect(root.callCount).toBe(2);
    expect(root.totalTokens).toBe(10);
  });

  it('fires onExceed when a budget is breached', () => {
    const breaches: Array<{ scope: string; id: string; actual: number }> = [];
    const tracker = createCostTracker({
      budgets: { perSession: 1, currency: 'USD' },
      onExceed: (e) => breaches.push({ scope: e.scope, id: e.id, actual: e.actual }),
    });
    tracker.record({
      spanId: 's',
      model: 'm',
      promptTokens: 0,
      completionTokens: 0,
      cost: { amount: 1.5, currency: 'USD' },
      sessionId: 'sess',
    });
    expect(breaches).toEqual([{ scope: 'session', id: 'sess', actual: 1.5 }]);
  });

  it('reset() clears every counter', () => {
    const tracker = createCostTracker();
    tracker.record({
      spanId: 's',
      model: 'm',
      promptTokens: 1,
      completionTokens: 1,
      sessionId: 'sess',
    });
    tracker.reset();
    expect(tracker.usage('session', 'sess').callCount).toBe(0);
  });

  it('onRollup listener receives every record and unsubscribes cleanly', () => {
    const tracker = createCostTracker();
    const seen: string[] = [];
    const off = tracker.onRollup((r) => seen.push(r.spanId));
    tracker.record({ spanId: 's1', model: 'm', promptTokens: 1, completionTokens: 1 });
    off();
    tracker.record({ spanId: 's2', model: 'm', promptTokens: 1, completionTokens: 1 });
    expect(seen).toEqual(['s1']);
  });

  it('returns ZERO snapshots for unknown ids', () => {
    const tracker = createCostTracker();
    expect(tracker.usage('session', 'missing').callCount).toBe(0);
    expect(tracker.usageForSpan('missing').callCount).toBe(0);
  });
});
