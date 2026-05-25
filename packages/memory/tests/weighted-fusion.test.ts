import type { Fact, MemoryHit } from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  fuseRrf,
  fuseWeighted,
  RRF_DEFAULT_K,
  RRFReranker,
  WeightedRRFReranker,
} from '../src/search/index.js';

function makeHit(id: string, score = 1): MemoryHit<Fact> {
  return {
    record: {
      id,
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: id,
      createdAt: new Date(0).toISOString(),
    },
    score,
    signals: { source: 1 },
  };
}

const ids = (hits: ReadonlyArray<MemoryHit<Fact>>): string[] => hits.map((h) => h.record.id);

/** nDCG@k with binary gains — small, test-local scorer for the labelled fixture. */
function ndcg(ranked: readonly string[], relevant: ReadonlySet<string>, k: number): number {
  let dcg = 0;
  for (let i = 0; i < Math.min(k, ranked.length); i++) {
    const id = ranked[i];
    const gain = id !== undefined && relevant.has(id) ? 1 : 0;
    dcg += gain / Math.log2(i + 2);
  }
  let idcg = 0;
  for (let i = 0; i < Math.min(k, relevant.size); i++) idcg += 1 / Math.log2(i + 2);
  return idcg === 0 ? 0 : dcg / idcg;
}

describe('@graphorin/memory/search — fuseWeighted', () => {
  const lists: Array<Array<MemoryHit<Fact>>> = [
    [makeHit('a'), makeHit('b'), makeHit('c')],
    [makeHit('b'), makeHit('c'), makeHit('a')],
  ];

  it('reproduces RRF exactly when weights are absent', () => {
    expect(fuseWeighted(lists, undefined, RRF_DEFAULT_K)).toEqual(fuseRrf(lists, RRF_DEFAULT_K));
  });

  it('reproduces RRF exactly at equal unit weights', () => {
    expect(fuseWeighted(lists, [1, 1], RRF_DEFAULT_K)).toEqual(fuseRrf(lists, RRF_DEFAULT_K));
  });

  it('preserves RRF ordering at equal non-unit weights (scores scale by the weight)', () => {
    const rrf = fuseRrf(lists, RRF_DEFAULT_K);
    const weighted = fuseWeighted(lists, [3, 3], RRF_DEFAULT_K);
    expect(ids(weighted)).toEqual(ids(rrf));
    expect(weighted[0]?.score).toBeCloseTo((rrf[0]?.score ?? 0) * 3, 9);
  });

  it('treats a missing / non-finite / negative weight as the neutral 1', () => {
    // Short array (list 1 weight missing), plus NaN / negative all fall back to 1.
    expect(fuseWeighted(lists, [1], RRF_DEFAULT_K)).toEqual(fuseRrf(lists, RRF_DEFAULT_K));
    expect(fuseWeighted(lists, [Number.NaN, -5], RRF_DEFAULT_K)).toEqual(
      fuseRrf(lists, RRF_DEFAULT_K),
    );
  });

  it('records the *weighted* rrf contribution while preserving upstream signals', () => {
    const weighted = fuseWeighted([[makeHit('a')], [makeHit('a')]], [2, 0], RRF_DEFAULT_K);
    const hit = weighted[0];
    expect(hit?.signals?.source).toBe(1); // upstream signal survives fusion
    // list 0 weight 2 (rank 1 ⇒ 2/61), list 1 weight 0 (zeroed) ⇒ rrf == 2/61.
    expect(hit?.signals?.rrf).toBeCloseTo(2 / 61, 9);
    expect(hit?.signals?.['rrf.list_0']).toBeCloseTo(2 / 61, 9);
    expect(hit?.signals?.['rrf.list_1']).toBe(0);
    expect(hit?.score).toBeCloseTo(2 / 61, 9);
  });

  it('tuned weights beat RRF on a labelled fixture (nDCG@2)', () => {
    // FTS list (noisy — no relevant docs) vs vector list (clean). Plain RRF
    // floats a noise doc to the top because it ties a relevant doc on rank;
    // up-weighting the trustworthy vector list fixes the ranking.
    const fts = [makeHit('noiseA'), makeHit('noiseB'), makeHit('noiseC')];
    const vector = [makeHit('d1'), makeHit('d2')];
    const relevant = new Set(['d1', 'd2']);

    const rrf = ndcg(ids(fuseRrf([fts, vector], RRF_DEFAULT_K)), relevant, 2);
    const weighted = ndcg(
      ids(fuseWeighted([fts, vector], [1, 3], RRF_DEFAULT_K)), // trust vector ×3
      relevant,
      2,
    );

    expect(weighted).toBeGreaterThan(rrf);
    expect(weighted).toBe(1); // weighting recovers the ideal ranking
    expect(rrf).toBeLessThan(1); // plain RRF does not
  });

  it('is empty for empty input', () => {
    expect(fuseWeighted([], [], RRF_DEFAULT_K)).toEqual([]);
  });
});

describe('@graphorin/memory/search — WeightedRRFReranker', () => {
  it('reports a stable id and defaults k to the canonical 60', () => {
    const r = new WeightedRRFReranker({ weights: [1, 2] });
    expect(r.id).toBe('weighted-rrf');
    expect(r.k).toBe(RRF_DEFAULT_K);
    expect(r.weights).toEqual([1, 2]);
  });

  it('rejects a non-positive / non-finite k', () => {
    expect(() => new WeightedRRFReranker({ weights: [1], k: 0 })).toThrow(TypeError);
    expect(() => new WeightedRRFReranker({ weights: [1], k: -1 })).toThrow(TypeError);
    expect(() => new WeightedRRFReranker({ weights: [1], k: Number.POSITIVE_INFINITY })).toThrow(
      TypeError,
    );
    expect(() => new WeightedRRFReranker({ weights: [1], k: Number.NaN })).toThrow(TypeError);
  });

  it('rejects a negative / non-finite weight', () => {
    expect(() => new WeightedRRFReranker({ weights: [-1] })).toThrow(TypeError);
    expect(() => new WeightedRRFReranker({ weights: [Number.NaN] })).toThrow(TypeError);
    expect(() => new WeightedRRFReranker({ weights: [Number.POSITIVE_INFINITY] })).toThrow(
      TypeError,
    );
  });

  it('at equal unit weights reproduces the RRFReranker result', async () => {
    const lists: Array<Array<MemoryHit<Fact>>> = [
      [makeHit('a'), makeHit('b'), makeHit('c')],
      [makeHit('b'), makeHit('c'), makeHit('a')],
    ];
    const weighted = await new WeightedRRFReranker({ weights: [1, 1] }).rerank('q', lists);
    const rrf = await new RRFReranker().rerank('q', lists);
    expect(weighted).toEqual(rrf);
  });

  it('up-weights a list so its top items win', async () => {
    const fts = [makeHit('noiseA'), makeHit('noiseB')];
    const vector = [makeHit('d1'), makeHit('d2')];
    const fused = await new WeightedRRFReranker({ weights: [1, 5] }).rerank('q', [fts, vector], {
      topK: 2,
    });
    expect(ids(fused)).toEqual(['d1', 'd2']);
  });

  it('respects topK and topK = 0', async () => {
    const lists = [[makeHit('a'), makeHit('b'), makeHit('c')]];
    expect(
      (await new WeightedRRFReranker({ weights: [1] }).rerank('q', lists, { topK: 2 })).length,
    ).toBe(2);
    expect(
      (await new WeightedRRFReranker({ weights: [1] }).rerank('q', lists, { topK: 0 })).length,
    ).toBe(0);
  });

  it('throws on an aborted signal', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(
      new WeightedRRFReranker({ weights: [1] }).rerank('q', [], { signal: ctrl.signal }),
    ).rejects.toThrow(/aborted/i);
  });
});

describe('types', () => {
  it('exposes the weighted-fusion surface', () => {
    expectTypeOf(fuseWeighted<Fact>).toBeFunction();
    expectTypeOf<Parameters<typeof fuseWeighted<Fact>>[1]>().toEqualTypeOf<
      ReadonlyArray<number> | undefined
    >();
    expectTypeOf(new WeightedRRFReranker({ weights: [1] }).id).toEqualTypeOf<'weighted-rrf'>();
  });
});
