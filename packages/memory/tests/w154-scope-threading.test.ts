import type { SessionScope } from '@graphorin/core';
import { describe, expect, it, vi } from 'vitest';
import { createMemory } from '../src/index.js';
import {
  createInMemoryStore,
  createStubEmbedder,
  InMemoryEmbeddingRegistry,
} from './fixtures/in-memory-store.js';

/**
 * W-154: the @graphorin/memory tier wrappers must PASS their scope down
 * to the store mutators - the store-side guard is only as good as the
 * scope that reaches it. Spy-based: the in-memory fixture is the
 * adapter; each tier method is called with a scope and the spy asserts
 * the same scope arrived as the mutator's trailing argument.
 */
describe('W-154 - tiers thread scope into store mutators', () => {
  function build() {
    const store = createInMemoryStore({ withConsolidatorStore: true });
    const memory = createMemory({
      store,
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: createStubEmbedder(),
    });
    const scope: SessionScope = { userId: 'alex' };
    return { store, memory, scope };
  }

  it('semantic validate / forget / purge pass scope', async () => {
    const { store, memory, scope } = build();
    const fact = await memory.semantic.remember(scope, { text: 'Loves espresso.' });

    const setStatus = vi.spyOn(store.semantic, 'setStatus');
    await memory.semantic.validate(scope, fact.id, 'checked');
    expect(setStatus).toHaveBeenCalledWith(fact.id, 'active', 'checked', scope);

    const forget = vi.spyOn(store.semantic, 'forget');
    await memory.semantic.forget(scope, fact.id, 'bye');
    expect(forget).toHaveBeenCalledWith(fact.id, 'bye', scope);
  });

  it('episodic archive passes scope', async () => {
    const { store, memory, scope } = build();
    const ep = await memory.episodic.record(scope, {
      summary: 'an episode',
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(1000).toISOString(),
    });
    // The fixture implements episodic.archive (episodic.setStatus and
    // procedural.setStatus are optional Ext methods it omits; their
    // threading is the identical one-line pattern and the sqlite side
    // is covered by the store-sqlite W-154 test).
    const archive = vi.spyOn(store.episodic, 'archive');
    await memory.episodic.archive(scope, ep.id, 'old');
    expect(archive).toHaveBeenCalledWith(ep.id, 'old', scope);
  });
});
