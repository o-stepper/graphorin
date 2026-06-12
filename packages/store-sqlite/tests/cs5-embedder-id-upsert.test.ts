import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Fact } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createSqliteStore } from '../src/index.js';

/**
 * CS-5 — the facts `ON CONFLICT(id) DO UPDATE` set must carry `embedder_id`
 * when (and only when) a re-write actually supplies an embedding. Missing it
 * hides late-embedded facts from vector search forever; nulling it
 * unconditionally would hide an existing fact when `supersede()` re-remembers
 * the new fact without an embedding.
 */
type SemanticVec = {
  rememberWithEmbedding(
    f: Fact,
    opts?: { embedding?: { embedderId: string; vector: Float32Array } },
  ): Promise<void>;
  searchVector(
    scope: { userId: string },
    embedding: Float32Array,
    embedderId: string,
    topK: number,
  ): Promise<ReadonlyArray<{ record: { id: string }; score: number }>>;
};

async function setup(): Promise<{
  semantic: SemanticVec;
  embedderId: string;
  close: () => Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cs5-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite` });
  await store.init();
  const meta = store.embeddings.registerOrReturn({
    id: 'transformersjs:e5@4',
    embedderKind: 'transformersjs',
    model: 'e5',
    dim: 4,
    distanceMetric: 'cosine',
    configHash: 'cs5',
  });
  return {
    semantic: store.memory.semantic as unknown as SemanticVec,
    embedderId: meta.id,
    close: () => store.close(),
  };
}

const base = { kind: 'semantic' as const, userId: 'alex', sensitivity: 'internal' as const };
const vec = new Float32Array([1, 0, 0, 0]);

describe('CS-5 — embedder_id is updated on a late-embedded upsert', () => {
  it('a fact first written without an embedding becomes vector-searchable after re-embedding', async () => {
    const { semantic, embedderId, close } = await setup();
    // First write: no embedding ⇒ facts.embedder_id is NULL.
    await semantic.rememberWithEmbedding({
      ...base,
      id: 'f1',
      text: 'loves espresso',
      createdAt: new Date().toISOString(),
    });
    // Re-remember the same id WITH an embedding ⇒ a vec0 row is written.
    await semantic.rememberWithEmbedding(
      { ...base, id: 'f1', text: 'loves espresso', createdAt: new Date().toISOString() },
      { embedding: { embedderId, vector: vec } },
    );
    // The searchVector guard joins on facts.embedder_id; if the upsert left it
    // NULL, the fact is hidden despite the vec0 row existing.
    const hits = await semantic.searchVector({ userId: 'alex' }, vec, embedderId, 5);
    expect(hits.map((h) => h.record.id)).toContain('f1');
    await close();
  });

  it('a no-embedding re-remember does not null an existing embedder_id (supersede path)', async () => {
    const { semantic, embedderId, close } = await setup();
    // First write WITH an embedding ⇒ embedder_id set, vec0 row present.
    await semantic.rememberWithEmbedding(
      { ...base, id: 'f2', text: 'enjoys tea', createdAt: new Date().toISOString() },
      { embedding: { embedderId, vector: vec } },
    );
    // Re-remember the same id WITHOUT an embedding (mirrors supersade's
    // internal re-remember of the new fact). embedder_id must be preserved.
    await semantic.rememberWithEmbedding({
      ...base,
      id: 'f2',
      text: 'enjoys tea now',
      createdAt: new Date().toISOString(),
    });
    const hits = await semantic.searchVector({ userId: 'alex' }, vec, embedderId, 5);
    expect(hits.map((h) => h.record.id)).toContain('f2');
    await close();
  });
});
