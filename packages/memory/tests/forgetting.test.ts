import type { SessionScope } from '@graphorin/core';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  type ConsolidatorConfig,
  type CreateConsolidatorOptions,
  DEFAULT_SALIENCE_WEIGHTS,
  NEUTRAL_IMPORTANCE,
  retention,
  type SalienceWeights,
  salience,
  selectForCapacityEviction,
} from '../src/consolidator/index.js';
import { _resetConsolidatorConfigWarningForTesting, createMemory } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

const NOW = Date.parse('2026-05-25T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

/** Salience signals for a fresh (1-day-old), neutral fact, overridable. */
function signals(
  over: Partial<Parameters<typeof salience>[0]> = {},
): Parameters<typeof salience>[0] {
  return {
    now: NOW,
    lastAccessedAt: NOW - DAY,
    createdAt: NOW - DAY,
    strength: 1,
    tauDays: 7,
    importance: null,
    quarantined: false,
    foreignProvenance: false,
    ...over,
  };
}

describe('consolidator/decay - multi-signal salience (X-1)', () => {
  it('collapses to plain retention for an unscored, active, first-party fact', () => {
    const base = retention({
      now: NOW,
      lastAccessedAt: NOW - DAY,
      createdAt: NOW - DAY,
      strength: 1,
      tauDays: 7,
    });
    expect(salience(signals())).toBeCloseTo(base, 10);
  });

  it('treats null importance as the neutral midpoint', () => {
    expect(salience(signals({ importance: null }))).toBeCloseTo(
      salience(signals({ importance: NEUTRAL_IMPORTANCE })),
      10,
    );
  });

  it('orders by importance: high > neutral > low (same retention)', () => {
    const hi = salience(signals({ importance: 1 }));
    const mid = salience(signals({ importance: NEUTRAL_IMPORTANCE }));
    const lo = salience(signals({ importance: 0 }));
    expect(hi).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(lo);
  });

  it('penalises a quarantined fact (P1-4 security-negative term)', () => {
    const active = salience(signals());
    const quar = salience(signals({ quarantined: true }));
    expect(quar).toBeLessThan(active);
    expect(quar).toBeCloseTo(active * (1 - DEFAULT_SALIENCE_WEIGHTS.quarantine), 10);
  });

  it('applies a milder penalty to foreign provenance than to quarantine', () => {
    const active = salience(signals());
    const foreign = salience(signals({ foreignProvenance: true }));
    const quar = salience(signals({ quarantined: true }));
    expect(foreign).toBeLessThan(active);
    expect(foreign).toBeGreaterThan(quar);
  });

  it('lets quarantine dominate provenance when both are set', () => {
    const both = salience(signals({ quarantined: true, foreignProvenance: true }));
    const quar = salience(signals({ quarantined: true }));
    expect(both).toBeCloseTo(quar, 10);
  });

  it('honours custom weights (zero quarantine weight ⇒ no penalty)', () => {
    const weights: SalienceWeights = { ...DEFAULT_SALIENCE_WEIGHTS, quarantine: 0 };
    expect(salience(signals({ quarantined: true, weights }))).toBeCloseTo(salience(signals()), 10);
  });

  it('never returns a negative salience even with overdriven weights', () => {
    const weights: SalienceWeights = { importance: 5, quarantine: 5, foreignProvenance: 5 };
    expect(salience(signals({ importance: 0, weights }))).toBeGreaterThanOrEqual(0);
    expect(salience(signals({ quarantined: true, weights }))).toBeGreaterThanOrEqual(0);
  });
});

describe('consolidator/decay - selectForCapacityEviction (X-1)', () => {
  const scored = [
    { id: 'a', salience: 0.9 },
    { id: 'b', salience: 0.2 },
    { id: 'c', salience: 0.5 },
    { id: 'd', salience: 0.1 },
  ];

  it('returns nothing when the batch already fits', () => {
    expect(selectForCapacityEviction(scored, 4)).toEqual([]);
    expect(selectForCapacityEviction(scored, 9)).toEqual([]);
  });

  it('evicts the lowest-salience ids down to capacity', () => {
    expect(selectForCapacityEviction(scored, 2)).toEqual(['d', 'b']);
  });

  it('breaks ties by id for determinism', () => {
    const tied = [
      { id: 'y', salience: 0.3 },
      { id: 'x', salience: 0.3 },
      { id: 'z', salience: 0.9 },
    ];
    expect(selectForCapacityEviction(tied, 1)).toEqual(['x', 'y']);
  });

  it('evicts the whole batch at capacity 0', () => {
    expect(selectForCapacityEviction(scored, 0)).toHaveLength(4);
  });
});

describe('MST-4 - any non-empty consolidator config implicitly enables', () => {
  it('decayCapacity alone constructs the real consolidator and the capacity applies', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      // No tier / provider / enabled - the old allow-list silently
      // installed a no-op placeholder for this exact shape.
      consolidator: { decayCapacity: 1, defaultScope: { userId: 'alex' } },
    });
    const scope: SessionScope = { userId: 'alex' };
    const a = await memory.semantic.remember(scope, { text: 'first fact' });
    const b = await memory.semantic.remember(scope, { text: 'second fact' });
    for (const id of [a.id, b.id]) {
      store.__hooks.setDecaySignals(id, {
        lastAccessedAt: Date.now() - DAY,
        createdAt: Date.now() - DAY,
        strength: 1,
      });
    }
    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('light', scope);
    // The placeholder returns null; the real runtime evicts down to 1.
    expect(outcome).not.toBeNull();
    expect(outcome?.factsUpdated).toBe(1);
  });

  it('enabled:false + real settings keeps the placeholder and warns once', async () => {
    _resetConsolidatorConfigWarningForTesting();
    const writes: string[] = [];
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
    try {
      const store = createInMemoryStore({ withConsolidatorStore: true });
      const memory = createMemory({
        store,
        embeddings: new InMemoryEmbeddingRegistry(),
        consolidator: { enabled: false, decayCapacity: 5000 },
      });
      const again = createMemory({
        store,
        embeddings: new InMemoryEmbeddingRegistry(),
        consolidator: { enabled: false, decayCapacity: 5000 },
      });
      expect(again).toBeDefined();
      const outcome = await memory.consolidator.fireNow('light', { userId: 'alex' });
      expect(outcome).toBeNull(); // placeholder
      const warned = writes.filter((w) => w.includes('enabled: false'));
      expect(warned.length).toBe(1); // once, not per createMemory
      expect(warned[0]).toContain('decayCapacity');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('consolidator light phase - capacity-bounded eviction (X-1)', () => {
  function freshAt(id: string, store: ReturnType<typeof createInMemoryStore>): void {
    store.__hooks.setDecaySignals(id, {
      lastAccessedAt: Date.now() - DAY,
      createdAt: Date.now() - DAY,
      strength: 1,
    });
  }

  it('archives the lowest-importance facts down to the capacity bound', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'free', decayCapacity: 2, defaultScope: { userId: 'alex' } },
    });
    const scope: SessionScope = { userId: 'alex' };

    const ids: Record<'top' | 'high' | 'low' | 'bottom', string> = {
      top: '',
      high: '',
      low: '',
      bottom: '',
    };
    for (const [label, importance] of [
      ['top', 0.9],
      ['high', 0.7],
      ['low', 0.3],
      ['bottom', 0.1],
    ] as const) {
      const fact = await memory.semantic.remember(scope, { text: `fact ${label}` });
      ids[label] = fact.id;
      freshAt(fact.id, store);
      store.__hooks.setImportance(fact.id, importance);
    }

    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('light', scope);

    expect(outcome?.factsUpdated).toBe(2); // two evicted to fit capacity 2

    const archived = new Map(
      ((await store.semantic.listForDecay?.(scope, 100, { includeArchived: true })) ?? []).map(
        (r) => [r.id, r.archived],
      ),
    );
    expect(archived.get(ids.top)).toBe(false);
    expect(archived.get(ids.high)).toBe(false);
    expect(archived.get(ids.low)).toBe(true);
    expect(archived.get(ids.bottom)).toBe(true);
  });

  it('evicts a quarantined fact before equally-fresh active ones (security term)', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'free', decayCapacity: 2, defaultScope: { userId: 'alex' } },
    });
    const scope: SessionScope = { userId: 'alex' };

    const a = await memory.semantic.remember(scope, { text: 'active one' });
    const b = await memory.semantic.remember(scope, { text: 'active two' });
    const q = await memory.semantic.remember(scope, { text: 'quarantined risky' });
    for (const id of [a.id, b.id, q.id]) freshAt(id, store);
    await store.semantic.setStatus?.(q.id, 'quarantined');

    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('light', scope);

    expect(outcome?.factsUpdated).toBe(1);
    const archived = new Map(
      ((await store.semantic.listForDecay?.(scope, 100, { includeArchived: true })) ?? []).map(
        (r) => [r.id, r.archived],
      ),
    );
    expect(archived.get(q.id)).toBe(true);
    expect(archived.get(a.id)).toBe(false);
    expect(archived.get(b.id)).toBe(false);
  });

  it('leaves storage unbounded when no capacity is configured', async () => {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
      consolidator: { tier: 'free', defaultScope: { userId: 'alex' } },
    });
    const scope: SessionScope = { userId: 'alex' };
    for (let i = 0; i < 5; i += 1) {
      const fact = await memory.semantic.remember(scope, { text: `keep ${i}` });
      freshAt(fact.id, store);
    }

    await memory.consolidator.start();
    const outcome = await memory.consolidator.fireNow('light', scope);

    expect(outcome?.factsUpdated).toBe(0); // fresh + no capacity ⇒ nothing archived
  });
});

describe('types', () => {
  it('exposes the documented public shapes', () => {
    expectTypeOf(salience).returns.toBeNumber();
    expectTypeOf(selectForCapacityEviction).returns.toEqualTypeOf<ReadonlyArray<string>>();
    expectTypeOf<SalienceWeights>().toMatchTypeOf<{ readonly quarantine: number }>();
    expectTypeOf(DEFAULT_SALIENCE_WEIGHTS).toMatchTypeOf<SalienceWeights>();
    expectTypeOf(NEUTRAL_IMPORTANCE).toBeNumber();
    expectTypeOf<ConsolidatorConfig['decayCapacity']>().toEqualTypeOf<number | null>();
    expectTypeOf<ConsolidatorConfig['salienceWeights']>().toEqualTypeOf<SalienceWeights>();
    expectTypeOf<CreateConsolidatorOptions['decayCapacity']>().toEqualTypeOf<
      number | null | undefined
    >();
  });
});
