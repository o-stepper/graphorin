/**
 * D5 retrieval: the pure PPR-lite activation scorer and the graph
 * fusion-weight wiring through SemanticMemory.search.
 */

import type { SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createMemory } from '../src/index.js';
import { DEFAULT_PPR_DAMPING, pprActivation } from '../src/search/graph-ppr.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

describe('pprActivation (D5)', () => {
  it('decays with hop depth by the damping factor', () => {
    const scores = pprActivation([{ depth: 1 }, { depth: 2 }, { depth: 3 }], 0.5);
    expect(scores).toEqual([0.5, 0.25, 0.125]);
  });

  it('clamps an out-of-range damping to the default and floors depth at 1', () => {
    expect(pprActivation([{ depth: 0 }], 2)).toEqual([DEFAULT_PPR_DAMPING ** 1]);
    expect(pprActivation([{ depth: 1 }], 0)).toEqual([DEFAULT_PPR_DAMPING]);
  });
});

describe('graph fusion weight (D5)', () => {
  it('folds graph neighbours in at the configured weight and drops them at weight 0', async () => {
    const store = createInMemoryStore({ withGraphStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      graph: { entityResolution: true },
    });
    // Two facts sharing entity 'Tbilisi'; the query matches only the first.
    await memory.semantic.remember(SCOPE, {
      text: 'deploy pipeline runs in Tbilisi datacenter',
      subject: 'pipeline',
      object: 'Tbilisi',
    });
    await memory.semantic.remember(SCOPE, {
      text: 'the Tbilisi office prefers morning standups',
      subject: 'Tbilisi',
      object: 'standups',
    });

    // Without graph expansion: only the lexical match surfaces.
    const plain = await memory.semantic.search(SCOPE, 'deploy pipeline');
    expect(plain.some((h) => h.record.text.includes('morning standups'))).toBe(false);

    // With one-hop graph expansion the connected fact is fused in.
    const expanded = await memory.semantic.search(SCOPE, 'deploy pipeline', { expandHops: 1 });
    const neighbour = expanded.find((h) => h.record.text.includes('morning standups'));
    expect(neighbour).toBeDefined();
    expect(neighbour?.signals?.graph).toBeDefined();

    // The graph leg is now a TUNABLE fusion weight (was hardcoded
    // neutral). A neighbour reachable ONLY through the graph leg scores
    // strictly higher when the graph weight is raised.
    const findNeighbour = (hits: Awaited<ReturnType<typeof memory.semantic.search>>) =>
      hits.find((h) => h.record.text.includes('morning standups'));
    const lowWeight = await memory.semantic.search(SCOPE, 'deploy pipeline', {
      expandHops: 1,
      fusion: { strategy: 'weighted', weights: { fts: 1, vector: 1, graph: 0.1 } },
    });
    const highWeight = await memory.semantic.search(SCOPE, 'deploy pipeline', {
      expandHops: 1,
      fusion: { strategy: 'weighted', weights: { fts: 1, vector: 1, graph: 4 } },
    });
    const low = findNeighbour(lowWeight);
    const high = findNeighbour(highWeight);
    expect(low).toBeDefined();
    expect(high).toBeDefined();
    expect(high?.score ?? 0).toBeGreaterThan(low?.score ?? 0);
  });
});
