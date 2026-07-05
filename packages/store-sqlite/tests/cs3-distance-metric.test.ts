import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createSqliteStore } from '../src/index.js';
import { scoreFromDistance } from '../src/vector-table-mgr.js';

describe('CS-3 - distance metric is honoured + scored in [0,1]', () => {
  it('scoreFromDistance maps cosine + euclidean distances into [0,1]', () => {
    // Cosine distance ∈ [0,2] (1 - cos): 0 → identical → 1; 2 → opposite → 0.
    expect(scoreFromDistance('cosine', 0)).toBe(1);
    expect(scoreFromDistance('cosine', 1)).toBeCloseTo(0.5, 6);
    expect(scoreFromDistance('cosine', 2)).toBe(0);
    // L2 distance ∈ [0,∞): 0 → 1, larger → smaller, never negative.
    expect(scoreFromDistance('euclidean', 0)).toBe(1);
    expect(scoreFromDistance('euclidean', 1)).toBeCloseTo(0.5, 6);
    expect(scoreFromDistance('euclidean', 9)).toBeCloseTo(0.1, 6);
  });

  it('creates the vec0 table with distance_metric and returns a cosine score in [0,1]', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cs3-'));
    const store = await createSqliteStore({ path: `${dir}/db.sqlite` });
    await store.init();
    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:e5@4',
      embedderKind: 'transformersjs',
      model: 'e5',
      dim: 4,
      distanceMetric: 'cosine',
      configHash: 'cs3',
    });
    const semantic = store.memory.semantic as unknown as {
      rememberWithEmbedding(
        f: import('@graphorin/core').Fact,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
      searchVector(
        scope: { userId: string },
        embedding: Float32Array,
        embedderId: string,
        topK: number,
      ): Promise<ReadonlyArray<{ record: { id: string }; score: number }>>;
    };

    // Two normalized vectors: f1 close to the query, f2 orthogonal.
    const norm = (v: number[]): Float32Array => {
      const m = Math.hypot(...v);
      return new Float32Array(v.map((x) => x / m));
    };
    const base = { kind: 'semantic' as const, userId: 'alex', sensitivity: 'internal' as const };
    await semantic.rememberWithEmbedding(
      { ...base, id: 'f1', text: 'near', createdAt: new Date().toISOString() },
      { embedding: { embedderId: meta.id, vector: norm([1, 1, 0, 0]) } },
    );
    await semantic.rememberWithEmbedding(
      { ...base, id: 'f2', text: 'far', createdAt: new Date().toISOString() },
      { embedding: { embedderId: meta.id, vector: norm([0, 0, 1, 1]) } },
    );

    // The vec0 table carries distance_metric=cosine in its DDL.
    const ddl = store.connection.get<{ sql: string }>(
      'SELECT sql FROM sqlite_master WHERE name = ?',
      [meta.vecTableFacts],
    );
    expect(ddl?.sql.toLowerCase()).toContain('distance_metric=cosine');

    const hits = await semantic.searchVector({ userId: 'alex' }, norm([1, 1, 0, 0]), meta.id, 2);
    expect(hits[0]?.record.id).toBe('f1'); // the near vector ranks first
    for (const h of hits) {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(1);
    }
    expect(hits[0]?.score).toBeGreaterThan(hits[1]?.score ?? 1); // near > far

    await store.close();
  });
});
