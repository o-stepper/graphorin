import type { Fact, MemoryHit } from '@graphorin/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { fuseRrf, RRF_DEFAULT_K, RRFReranker } from '../src/search/index.js';

function makeFactHit(id: string, score: number): MemoryHit<Fact> {
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

describe('@graphorin/memory/search — RRFReranker', () => {
  it('exposes the canonical default k = 60', () => {
    const r = new RRFReranker();
    expect(RRF_DEFAULT_K).toBe(60);
    expect(r.k).toBe(60);
    expect(r.id).toBe('rrf');
  });

  it('rejects non-positive k values', () => {
    expect(() => new RRFReranker(0)).toThrow(TypeError);
    expect(() => new RRFReranker(-1)).toThrow(TypeError);
    expect(() => new RRFReranker(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    expect(() => new RRFReranker(Number.NaN)).toThrow(TypeError);
  });

  it('fuses two ranked lists and ranks shared records by reciprocal rank sum', async () => {
    const reranker = new RRFReranker();
    const lists: Array<Array<MemoryHit<Fact>>> = [
      [makeFactHit('a', 0.9), makeFactHit('b', 0.8), makeFactHit('c', 0.7)],
      [makeFactHit('a', 0.9), makeFactHit('b', 0.8), makeFactHit('c', 0.7)],
    ];
    const fused = await reranker.rerank('q', lists, { topK: 3 });
    expect(fused.length).toBe(3);
    expect(fused.map((h) => h.record.id)).toEqual(['a', 'b', 'c']);
    expect(fused[0]?.signals?.rrf).toBeGreaterThan(0);
  });

  it('rank-1 in two lists outscores rank-1-in-one + rank-2-in-one', async () => {
    const reranker = new RRFReranker();
    const lists: Array<Array<MemoryHit<Fact>>> = [
      [makeFactHit('a', 0.9), makeFactHit('b', 0.8), makeFactHit('c', 0.7)],
      [makeFactHit('b', 0.9), makeFactHit('c', 0.8), makeFactHit('a', 0.7)],
    ];
    const fused = await reranker.rerank('q', lists, { topK: 3 });
    // 'b' ranks (2 in L1, 1 in L2) → 1/62 + 1/61 ≈ 0.03253
    // 'a' ranks (1 in L1, 3 in L2) → 1/61 + 1/63 ≈ 0.03227
    // 'c' ranks (3 in L1, 2 in L2) → 1/63 + 1/62 ≈ 0.03200
    expect(fused[0]?.record.id).toBe('b');
    expect(fused[1]?.record.id).toBe('a');
    expect(fused[2]?.record.id).toBe('c');
  });

  it('respects topK', async () => {
    const reranker = new RRFReranker();
    const lists = [
      [makeFactHit('a', 1), makeFactHit('b', 1), makeFactHit('c', 1), makeFactHit('d', 1)],
    ];
    const fused = await reranker.rerank('q', lists, { topK: 2 });
    expect(fused.length).toBe(2);
  });

  it('honours topK = 0 by returning an empty array', async () => {
    const reranker = new RRFReranker();
    const lists = [[makeFactHit('a', 1)]];
    const fused = await reranker.rerank('q', lists, { topK: 0 });
    expect(fused.length).toBe(0);
  });

  it('throws on aborted signal', async () => {
    const reranker = new RRFReranker();
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(reranker.rerank('q', [], { signal: ctrl.signal })).rejects.toThrow(/aborted/i);
  });

  it('preserves user signals from the source lists', async () => {
    const lists = [[makeFactHit('a', 0.9)], [makeFactHit('a', 0.8)]];
    const fused = await new RRFReranker().rerank('q', lists);
    expect(fused[0]?.signals?.source).toBe(1);
    expect(fused[0]?.signals?.['rrf.list_0']).toBeGreaterThan(0);
    expect(fused[0]?.signals?.['rrf.list_1']).toBeGreaterThan(0);
  });

  it('property: fuse output is independent of input list permutation', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 4 }), { minLength: 1, maxLength: 6 }),
        fc.array(fc.string({ minLength: 1, maxLength: 4 }), { minLength: 1, maxLength: 6 }),
        (listA, listB) => {
          const dedupA = uniq(listA);
          const dedupB = uniq(listB);
          const a: MemoryHit<Fact>[] = dedupA.map((id, i) => makeFactHit(id, 1 - i / 100));
          const b: MemoryHit<Fact>[] = dedupB.map((id, i) => makeFactHit(id, 1 - i / 100));
          const fused1 = fuseRrf<Fact>([a, b], 60);
          const fused2 = fuseRrf<Fact>([b, a], 60);
          const ids1 = fused1.map((h) => h.record.id);
          const ids2 = fused2.map((h) => h.record.id);
          // The ids set is identical; the score per id is identical.
          expect(new Set(ids1)).toEqual(new Set(ids2));
          for (const id of ids1) {
            const s1 = fused1.find((h) => h.record.id === id)?.score ?? 0;
            const s2 = fused2.find((h) => h.record.id === id)?.score ?? 0;
            expect(Math.abs(s1 - s2)).toBeLessThan(1e-9);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});

function uniq(arr: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

describe('MRET-13 — retriever-kind signal labels', () => {
  const labelHit = (id: string, score: number) => ({
    record: {
      id,
      kind: 'semantic' as const,
      userId: 'u1',
      sensitivity: 'internal' as const,
      createdAt: new Date(0).toISOString(),
    },
    score,
  });

  it('keys per-list contributions by the supplied label, falling back to position', () => {
    const fused = fuseRrf([[labelHit('a', 1)], [labelHit('a', 0.9)], [labelHit('b', 0.8)]], 60, [
      'fts_0',
      'vector_0',
      // third list intentionally unlabeled → positional fallback
    ]);
    const a = fused.find((h) => h.record.id === 'a');
    const b = fused.find((h) => h.record.id === 'b');
    expect(a?.signals?.['rrf.fts_0']).toBeGreaterThan(0);
    expect(a?.signals?.['rrf.vector_0']).toBeGreaterThan(0);
    expect(a?.signals?.['rrf.list_0']).toBeUndefined();
    expect(b?.signals?.['rrf.list_2']).toBeGreaterThan(0);
  });

  it('labels survive a conditionally-absent leg (the same kind keeps the same key)', () => {
    const withVector = fuseRrf([[labelHit('a', 1)], [labelHit('a', 0.9)]], 60, [
      'fts_0',
      'vector_0',
    ]);
    const withoutVector = fuseRrf([[labelHit('a', 1)]], 60, ['fts_0']);
    expect(withVector[0]?.signals?.['rrf.fts_0']).toBeDefined();
    expect(withoutVector[0]?.signals?.['rrf.fts_0']).toBeDefined();
  });
});
