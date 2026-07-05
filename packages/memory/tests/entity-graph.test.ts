/**
 * P2-1 - relation graph in `@graphorin/memory`: the pure resolution
 * policy (normalize / cosine / decision / adjudication parsing), the
 * `EntityResolver` (lexical + embedding dedup, conservative ambiguous
 * handling, opt-in LLM adjudication), and the end-to-end write→link→
 * `search({ expandHops })` path through the facade.
 */

import type { EmbedderProvider, Fact, Provider, SessionScope } from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type CreateMemoryOptions,
  cosineSimilarity,
  createMemory,
  type EntityResolveDecision,
  EntityResolver,
  type FactSearchOptions,
  normalizeEntityName,
  parseAdjudication,
  resolveEntityDecision,
} from '../src/index.js';
import type { GraphMemoryStoreExt } from '../src/internal/storage-adapter.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const scope: SessionScope = { userId: 'alex' };
const PIPELINE_OFF = { pipeline: 'off' } as const;
const ids = (hits: ReadonlyArray<{ record: { id: string } }>): string[] =>
  hits.map((h) => h.record.id);

/** Embedder returning a caller-controlled vector per exact text. */
function vecEmbedder(map: Record<string, number[]>): EmbedderProvider {
  return {
    id: () => 'vec:test',
    dim: () => 3,
    configHash: () => 'vec-cfg',
    async embed(texts) {
      return texts.map((t) => new Float32Array(map[t] ?? [0, 0, 0]));
    },
  };
}

/** Minimal provider stub for adjudication - always replies `reply`. */
function fixedProvider(reply: string): Provider {
  return {
    async generate() {
      return { text: reply };
    },
  } as unknown as Provider;
}

function graphOf(store: { graph?: GraphMemoryStoreExt }): GraphMemoryStoreExt {
  if (store.graph === undefined) throw new Error('fixture missing graph store');
  return store.graph;
}

describe('P2-1 pure resolution policy', () => {
  it('normalizeEntityName folds case / whitespace / surrounding punctuation', () => {
    expect(normalizeEntityName('  Anna S. ')).toBe('anna s');
    expect(normalizeEntityName('Anna!')).toBe('anna');
    expect(normalizeEntityName('"Tbilisi"')).toBe('tbilisi');
    expect(normalizeEntityName('   ')).toBe('');
    expect(normalizeEntityName('...')).toBe('');
  });

  it('cosineSimilarity: 1 for identical, 0 for orthogonal / empty', () => {
    expect(cosineSimilarity(new Float32Array([1, 0]), new Float32Array([1, 0]))).toBeCloseTo(1, 6);
    expect(cosineSimilarity(new Float32Array([1, 0]), new Float32Array([0, 1]))).toBeCloseTo(0, 6);
    expect(cosineSimilarity(new Float32Array([]), new Float32Array([1]))).toBe(0);
  });

  it('decision: lexical exact wins regardless of vectors', () => {
    const d = resolveEntityDecision({
      normalizedName: 'anna',
      vector: new Float32Array([0, 1, 0]),
      candidates: [{ id: 'e1', normalizedName: 'anna', vector: new Float32Array([1, 0, 0]) }],
      mergeThreshold: 0.92,
      adjudicateThreshold: 0.82,
    });
    expect(d).toEqual({ kind: 'match', entityId: 'e1', similarity: 1, via: 'lexical' });
  });

  it('decision: embedding bands → match / ambiguous / new', () => {
    const cand = [{ id: 'e1', normalizedName: 'anna', vector: new Float32Array([1, 0, 0]) }];
    const base = {
      normalizedName: 'anna s',
      candidates: cand,
      mergeThreshold: 0.92,
      adjudicateThreshold: 0.82,
    };
    // cosine 1.0 ⇒ match (embedding)
    expect(resolveEntityDecision({ ...base, vector: new Float32Array([1, 0, 0]) })).toMatchObject({
      kind: 'match',
      via: 'embedding',
    });
    // cosine ~0.857 ⇒ ambiguous
    expect(resolveEntityDecision({ ...base, vector: new Float32Array([1.7, 1, 0]) }).kind).toBe(
      'ambiguous',
    );
    // cosine ~0.6 ⇒ new
    expect(resolveEntityDecision({ ...base, vector: new Float32Array([0.75, 1, 0]) })).toEqual({
      kind: 'new',
    });
    // no vector + no lexical match ⇒ new
    expect(resolveEntityDecision({ ...base, vector: null })).toEqual({ kind: 'new' });
  });

  it('decision: never matches a candidate from a different embedder (MST-11)', () => {
    const identical = new Float32Array([1, 0, 0]);
    // A candidate whose vector is identical but came from a DIFFERENT embedder
    // must be skipped - its cosine is meaningless across vector spaces.
    const crossEmbedder = resolveEntityDecision({
      normalizedName: 'anna s',
      vector: identical,
      vectorEmbedderId: 'embedder-A',
      candidates: [
        { id: 'e1', normalizedName: 'anna smith', vector: identical, embedderId: 'embedder-B' },
      ],
      mergeThreshold: 0.92,
      adjudicateThreshold: 0.82,
    });
    expect(crossEmbedder.kind).toBe('new');
    // Same embedder ⇒ still matches.
    const sameEmbedder = resolveEntityDecision({
      normalizedName: 'anna s',
      vector: identical,
      vectorEmbedderId: 'embedder-A',
      candidates: [
        { id: 'e1', normalizedName: 'anna smith', vector: identical, embedderId: 'embedder-A' },
      ],
      mergeThreshold: 0.92,
      adjudicateThreshold: 0.82,
    });
    expect(sameEmbedder).toMatchObject({ kind: 'match', entityId: 'e1', via: 'embedding' });
    // Absent embedder ids ⇒ compared (byte-identical default).
    const noIds = resolveEntityDecision({
      normalizedName: 'anna s',
      vector: identical,
      candidates: [{ id: 'e1', normalizedName: 'anna smith', vector: identical }],
      mergeThreshold: 0.92,
      adjudicateThreshold: 0.82,
    });
    expect(noIds.kind).toBe('match');
  });

  it('parseAdjudication accepts only a clear yes', () => {
    expect(parseAdjudication('yes')).toBe(true);
    expect(parseAdjudication('Yes, same person.')).toBe(true);
    expect(parseAdjudication('no')).toBe(false);
    expect(parseAdjudication('')).toBe(false);
    expect(parseAdjudication('maybe')).toBe(false);
  });
});

describe('P2-1 EntityResolver', () => {
  it('dedups by exact lexical name (no embedder needed)', async () => {
    const graph = graphOf(createInMemoryStore({ withGraphStore: true }));
    const resolver = new EntityResolver({ store: graph });
    const a = await resolver.resolve(scope, 'Anna');
    const b = await resolver.resolve(scope, 'anna'); // normalizes the same
    expect(b).toBe(a);
    expect((await graph.listEntities(scope)).length).toBe(1);
  });

  it('folds an alias via embedding similarity (≥ merge threshold)', async () => {
    const graph = graphOf(createInMemoryStore({ withGraphStore: true }));
    const resolver = new EntityResolver({
      store: graph,
      embedder: vecEmbedder({ Anna: [1, 0, 0], 'Anna S.': [0.99, 0.14, 0] }),
      embedderId: () => 'vec:test',
    });
    const a = await resolver.resolve(scope, 'Anna');
    const alias = await resolver.resolve(scope, 'Anna S.'); // ~0.99 cosine
    expect(alias).toBe(a);
    expect((await graph.listEntities(scope)).length).toBe(1);
  });

  it('ambiguous band mints a NEW entity by default (no auto-merge offline)', async () => {
    const graph = graphOf(createInMemoryStore({ withGraphStore: true }));
    const resolver = new EntityResolver({
      store: graph,
      embedder: vecEmbedder({ Anna: [1, 0, 0], Annie: [1.7, 1, 0] }), // ~0.86
      embedderId: () => 'vec:test',
    });
    await resolver.resolve(scope, 'Anna');
    await resolver.resolve(scope, 'Annie');
    expect((await graph.listEntities(scope)).length).toBe(2); // conservative
  });

  it('LLM adjudication folds an ambiguous match when the provider says yes', async () => {
    const graph = graphOf(createInMemoryStore({ withGraphStore: true }));
    const resolver = new EntityResolver({
      store: graph,
      embedder: vecEmbedder({ Anna: [1, 0, 0], Annie: [1.7, 1, 0] }),
      embedderId: () => 'vec:test',
      provider: fixedProvider('yes'),
      config: { llmAdjudication: true },
    });
    const a = await resolver.resolve(scope, 'Anna');
    const annie = await resolver.resolve(scope, 'Annie');
    expect(annie).toBe(a);
    expect((await graph.listEntities(scope)).length).toBe(1);
  });

  it('LLM adjudication keeps them separate when the provider says no', async () => {
    const graph = graphOf(createInMemoryStore({ withGraphStore: true }));
    const resolver = new EntityResolver({
      store: graph,
      embedder: vecEmbedder({ Anna: [1, 0, 0], Annie: [1.7, 1, 0] }),
      embedderId: () => 'vec:test',
      provider: fixedProvider('no'),
      config: { llmAdjudication: true },
    });
    await resolver.resolve(scope, 'Anna');
    await resolver.resolve(scope, 'Annie');
    expect((await graph.listEntities(scope)).length).toBe(2);
  });

  it('linkFact links subject + object; resolve("") → null', async () => {
    const graph = graphOf(createInMemoryStore({ withGraphStore: true }));
    const resolver = new EntityResolver({ store: graph });
    expect(await resolver.resolve(scope, '   ')).toBeNull();
    const fact: Fact = {
      id: 'f1',
      kind: 'semantic',
      userId: scope.userId,
      sensitivity: 'internal',
      text: 'Anna recommended sushi',
      subject: 'Anna',
      object: 'sushi',
      createdAt: new Date().toISOString(),
    };
    await resolver.linkFact(scope, fact);
    expect((await graph.listEntities(scope)).map((e) => e.normalizedName).sort()).toEqual([
      'anna',
      'sushi',
    ]);
    expect(await graph.expandOneHop(scope, ['f1'])).toEqual([]); // only one fact linked
  });
});

describe('CS-11 resolver candidate-window safety', () => {
  /** Wrap a graph store to count `listEntities` candidate scans. */
  function countingGraph(inner: GraphMemoryStoreExt): {
    graph: GraphMemoryStoreExt;
    calls: () => number;
  } {
    let listCalls = 0;
    return {
      calls: () => listCalls,
      graph: {
        ...inner,
        listEntities: (s, opts) => {
          listCalls += 1;
          return inner.listEntities(s, opts);
        },
      },
    };
  }

  it('resolves an exact alias of an entity beyond the candidate cap (no scan, no dup)', async () => {
    const { graph, calls } = countingGraph(graphOf(createInMemoryStore({ withGraphStore: true })));
    const resolver = new EntityResolver({ store: graph });
    // The oldest entity - pushed far outside any most-recent-N window.
    const alpha = await resolver.resolve(scope, 'Alpha');
    // Flood the store well past the 1000-row candidate cap.
    for (let i = 0; i < 1100; i++) await resolver.resolve(scope, `filler-${i}`);
    const before = calls();
    // An uncapped exact lookup resolves the old alias without deserializing
    // the candidate window - and without minting a duplicate.
    const again = await resolver.resolve(scope, 'alpha');
    expect(again).toBe(alpha);
    expect(calls()).toBe(before); // no candidate scan on the exact-alias path
  });

  it('does not deserialize the candidate window when there is no query vector', async () => {
    const { graph, calls } = countingGraph(graphOf(createInMemoryStore({ withGraphStore: true })));
    // No embedder ⇒ no query vector ⇒ embedding dedup is impossible, so the
    // BLOB-deserializing candidate scan must be skipped entirely.
    const resolver = new EntityResolver({ store: graph });
    await resolver.resolve(scope, 'Anna');
    await resolver.resolve(scope, 'Bob');
    expect(calls()).toBe(0);
  });
});

describe('P2-1 search({ expandHops }) end-to-end', () => {
  // No embedder ⇒ the fixture's thresholdless vector search is off, so a
  // plain search returns only the lexical (FTS substring) match - the
  // neighbour can appear *only* via the graph hop.
  function memoryWithResolution(over: Partial<CreateMemoryOptions> = {}) {
    return createMemory({
      store: createInMemoryStore({ withGraphStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      graph: { entityResolution: true },
      ...over,
    });
  }

  async function seedChain(memory: ReturnType<typeof createMemory>): Promise<void> {
    await memory.semantic.remember(
      scope,
      { text: 'met anna while in tbilisi', object: 'Anna' },
      PIPELINE_OFF,
    );
    await memory.semantic.remember(
      scope,
      { text: 'anna recommended a sushi place', subject: 'Anna' },
      PIPELINE_OFF,
    );
  }

  it('expandHops:1 surfaces the entity-sharing neighbour; default does not', async () => {
    const memory = memoryWithResolution();
    await seedChain(memory);

    const plain = await memory.semantic.search(scope, 'tbilisi');
    // The seed matches lexically; the neighbour does not.
    expect(plain.some((h) => h.record.text.includes('tbilisi'))).toBe(true);
    expect(plain.some((h) => h.record.text.includes('sushi'))).toBe(false);

    const hopped = await memory.semantic.search(scope, 'tbilisi', { expandHops: 1 });
    expect(hopped.some((h) => h.record.text.includes('sushi'))).toBe(true); // neighbour pulled in
    // The neighbour carries the graph signal.
    const neighbour = hopped.find((h) => h.record.text.includes('sushi'));
    expect(neighbour?.signals?.graph).toBe(1);
  });

  it('expandHops:0 is identical to the default (no expansion)', async () => {
    const memory = memoryWithResolution();
    await seedChain(memory);
    const def = await memory.semantic.search(scope, 'tbilisi');
    const zero = await memory.semantic.search(scope, 'tbilisi', { expandHops: 0 });
    expect(ids(zero)).toEqual(ids(def));
  });

  it('without entity resolution, expandHops:1 is a no-op (no links formed)', async () => {
    const memory = createMemory({
      store: createInMemoryStore({ withGraphStore: true }),
      embeddings: new InMemoryEmbeddingRegistry(),
      // graph.entityResolution omitted ⇒ no resolver ⇒ no fact_entities.
    });
    await seedChain(memory);
    const hopped = await memory.semantic.search(scope, 'tbilisi', { expandHops: 1 });
    expect(hopped.some((h) => h.record.text.includes('sushi'))).toBe(false);
  });

  it('carries s/p/o onto the persisted fact', async () => {
    const memory = memoryWithResolution();
    await memory.semantic.remember(
      scope,
      {
        text: 'anna recommended sushi',
        subject: 'Anna',
        predicate: 'recommended',
        object: 'sushi',
      },
      PIPELINE_OFF,
    );
    const [hit] = await memory.semantic.search(scope, 'sushi');
    expect(hit?.record.subject).toBe('Anna');
    expect(hit?.record.predicate).toBe('recommended');
    expect(hit?.record.object).toBe('sushi');
  });
});

describe('P2-1 types', () => {
  it('exposes the graph search + resolver surface', () => {
    expectTypeOf<FactSearchOptions['expandHops']>().toEqualTypeOf<0 | 1 | 2 | undefined>();
    expectTypeOf<CreateMemoryOptions['graph']>().toMatchTypeOf<
      { readonly entityResolution?: boolean } | undefined
    >();
    expectTypeOf(normalizeEntityName).toBeFunction();
    expectTypeOf<EntityResolveDecision>().toMatchTypeOf<{ kind: 'match' | 'ambiguous' | 'new' }>();
    expectTypeOf(new EntityResolver({ store: {} as GraphMemoryStoreExt })).toHaveProperty(
      'resolve',
    );
  });
});
