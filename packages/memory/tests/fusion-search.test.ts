import type { SessionScope } from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createMemory, type FactSearchOptions } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

const scope: SessionScope = { userId: 'alex' };
const PIPELINE_OFF = { pipeline: 'off' } as const;

function seededMemory() {
  return createMemory({
    store: createInMemoryStore(),
    embeddings: new InMemoryEmbeddingRegistry(),
    embedder: createStubEmbedder(),
  });
}

const ids = (hits: ReadonlyArray<{ record: { id: string } }>): string[] =>
  hits.map((h) => h.record.id);

describe('weighted fusion via search() (X-2)', () => {
  it('defaults to RRF and explicit { strategy: "rrf" } is identical', async () => {
    const memory = seededMemory();
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'beta widget' }, PIPELINE_OFF);

    const def = await memory.semantic.search(scope, 'alpha');
    const explicit = await memory.semantic.search(scope, 'alpha', {
      fusion: { strategy: 'rrf' },
    });

    expect(ids(explicit)).toEqual(ids(def)); // explicit rrf == default path
  });

  it('reproduces the default RRF ranking at equal unit weights', async () => {
    const memory = seededMemory();
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'beta widget' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'gamma alpha thing' }, PIPELINE_OFF);

    const def = await memory.semantic.search(scope, 'alpha');
    const equal = await memory.semantic.search(scope, 'alpha', {
      fusion: { strategy: 'weighted', weights: { fts: 1, vector: 1 } },
    });

    expect(ids(equal)).toEqual(ids(def)); // unit weights ⇒ RRF, end to end
  });

  it('routes the per-list weight into fusion (vector weight 0 zeroes the rrf term)', async () => {
    const memory = seededMemory();
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'beta widget' }, PIPELINE_OFF);

    // Query matches nothing lexically ⇒ the FTS list is empty and every
    // candidate arrives only through the (thresholdless) vector list.
    const zeroed = await memory.semantic.search(scope, 'zzz', {
      fusion: { strategy: 'weighted', weights: { fts: 1, vector: 0 } },
    });
    expect(zeroed.length).toBeGreaterThan(0);
    for (const hit of zeroed) expect(hit.signals?.rrf).toBe(0); // vector contribution zeroed
  });

  it('MEMORY-R-02: a malformed per-call weight degrades to neutral instead of throwing', async () => {
    const memory = seededMemory();
    await memory.semantic.remember(scope, { text: 'alpha gizmo' }, PIPELINE_OFF);
    await memory.semantic.remember(scope, { text: 'beta widget' }, PIPELINE_OFF);
    // A NaN weight used to reach the WeightedRRFReranker constructor and throw,
    // failing the whole search; it must degrade to the neutral default.
    const def = await memory.semantic.search(scope, 'alpha');
    const malformed = await memory.semantic.search(scope, 'alpha', {
      fusion: { strategy: 'weighted', weights: { fts: Number.NaN, vector: -3 } },
    });
    // Both weights degrade to 1 => identical to the default RRF ranking.
    expect(ids(malformed)).toEqual(ids(def));

    const baseline = await memory.semantic.search(scope, 'zzz');
    expect(baseline.some((hit) => (hit.signals?.rrf ?? 0) > 0)).toBe(true); // default counts it
  });
});

describe('types', () => {
  it('exposes the fusion search option', () => {
    expectTypeOf<FactSearchOptions['fusion']>().toEqualTypeOf<
      | { readonly strategy: 'rrf' }
      | {
          readonly strategy: 'weighted';
          readonly weights: {
            readonly fts?: number;
            readonly vector?: number;
            readonly graph?: number;
            readonly entity?: number;
          };
          readonly k?: number;
        }
      | undefined
    >();
  });
});
