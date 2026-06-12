/**
 * PS-10 — the memory tiers must tag embed calls with the asymmetric retrieval
 * role: `passage` when embedding content for storage, `query` when embedding a
 * search query. (The transformersjs embedder turns that into the E5 prefix; an
 * untagged embedder simply ignores it.)
 */
import type { EmbedderProvider, EmbedOptions, SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createMemory } from '../src/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

interface EmbedCall {
  readonly texts: string[];
  readonly taskType: EmbedOptions['taskType'];
}

function recordingEmbedder(calls: EmbedCall[]): EmbedderProvider {
  return {
    id: () => 'rec:test@8',
    dim: () => 8,
    configHash: () => 'rec',
    async embed(texts, opts) {
      calls.push({ texts: [...texts], taskType: opts?.taskType });
      // A constant unit vector — enough to drive the vector write/search path.
      return texts.map(() => {
        const v = new Float32Array(8);
        v[0] = 1;
        return v;
      });
    },
  };
}

describe('PS-10 — taskType threaded through the memory tiers', () => {
  it('remember embeds as passage; search embeds as query', async () => {
    const calls: EmbedCall[] = [];
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      embedder: recordingEmbedder(calls),
    });

    await memory.semantic.remember(SCOPE, { text: 'Anna moved to Berlin in March' });
    const writeCalls = calls.filter((c) => c.texts.some((t) => t.includes('Anna moved')));
    expect(writeCalls.length).toBeGreaterThan(0);
    expect(writeCalls.every((c) => c.taskType === 'passage')).toBe(true);

    calls.length = 0;
    await memory.semantic.search(SCOPE, 'where did Anna move');
    const queryCalls = calls.filter((c) => c.texts.some((t) => t.includes('where did Anna')));
    expect(queryCalls.length).toBeGreaterThan(0);
    expect(queryCalls.every((c) => c.taskType === 'query')).toBe(true);
  });
});
