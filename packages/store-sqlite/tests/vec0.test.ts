import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSqliteStore } from '../src/index.js';

describe('vec0 integration via sqlite-vec', () => {
  it('lazy-creates per-embedder vec0 tables and writes/reads vectors', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-vec-'));
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
    });
    await store.init();

    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:multilingual-e5-base@8',
      embedderKind: 'transformersjs',
      model: 'multilingual-e5-base',
      dim: 8,
      configHash: 'config-1',
    });

    const semantic = store.memory.semantic as unknown as {
      rememberWithEmbedding(
        f: import('@graphorin/core').Fact,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
    };

    const vector = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    await semantic.rememberWithEmbedding(
      {
        id: 'f1',
        kind: 'semantic',
        userId: 'alex',
        sensitivity: 'internal',
        text: 'Loves espresso.',
        createdAt: new Date().toISOString(),
      },
      { embedding: { embedderId: meta.id, vector } },
    );

    // sqlite-vec creates several shadow tables alongside each vec0
    // virtual table; the canonical name is recorded as `type='table'`
    // alongside its shadow rows. Verify the canonical name exists.
    const tables = store.connection.all<{ name: string; type: string }>(
      "SELECT name, type FROM sqlite_master WHERE name LIKE 'facts_vec_%'",
    );
    const names = tables.map((t) => t.name);
    expect(names).toContain(meta.vecTableFacts);

    const rows = store.connection.all<{ fact_id: string }>(
      `SELECT fact_id FROM ${meta.vecTableFacts}`,
    );
    expect(rows.map((r) => r.fact_id)).toEqual(['f1']);

    await store.close();
  });

  it('preexisting per-embedder vec0 tables are not recreated by VectorTableManager', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-vec-precreate-'));
    const store = await createSqliteStore({ path: `${dir}/db.sqlite` });
    await store.init();

    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:m@8',
      embedderKind: 'transformersjs',
      model: 'm',
      dim: 8,
      configHash: 'cfg-precreate',
    });

    const semantic = store.memory.semantic as unknown as {
      rememberWithEmbedding(
        f: import('@graphorin/core').Fact,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
    };

    // Round 1: first write creates the vec0 table.
    await semantic.rememberWithEmbedding(
      {
        id: 'f1',
        kind: 'semantic',
        userId: 'alex',
        sensitivity: 'internal',
        text: 'first',
        createdAt: new Date().toISOString(),
      },
      {
        embedding: { embedderId: meta.id, vector: new Float32Array(8) },
      },
    );

    const beforeCount = store.connection.all<{ name: string }>(
      'SELECT name FROM sqlite_master WHERE name = ?',
      [meta.vecTableFacts],
    ).length;
    expect(beforeCount).toBe(1);

    // Round 2: re-open the same DB; the manager should pick up the
    // preexisting vec0 table and NOT issue a CREATE that would fail
    // or duplicate state.
    await store.close();
    const reopened = await createSqliteStore({ path: `${dir}/db.sqlite` });
    await reopened.init();
    reopened.embeddings.registerOrReturn({
      id: 'transformersjs:m@8',
      embedderKind: 'transformersjs',
      model: 'm',
      dim: 8,
      configHash: 'cfg-precreate',
    });
    const reopenedSemantic = reopened.memory.semantic as unknown as {
      rememberWithEmbedding(
        f: import('@graphorin/core').Fact,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
    };
    await reopenedSemantic.rememberWithEmbedding(
      {
        id: 'f2',
        kind: 'semantic',
        userId: 'alex',
        sensitivity: 'internal',
        text: 'second',
        createdAt: new Date().toISOString(),
      },
      {
        embedding: { embedderId: meta.id, vector: new Float32Array(8) },
      },
    );

    const factVecRows = reopened.connection.all<{ fact_id: string }>(
      `SELECT fact_id FROM ${meta.vecTableFacts} ORDER BY fact_id`,
    );
    expect(factVecRows.map((r) => r.fact_id)).toEqual(['f1', 'f2']);
    await reopened.close();
  });

  it('rejects writes when the embedding vector dim does not match the registered dim', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-vec-dim-'));
    const store = await createSqliteStore({ path: `${dir}/db.sqlite` });
    await store.init();
    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:m@8',
      embedderKind: 'transformersjs',
      model: 'm',
      dim: 8,
      configHash: 'cfg-dim',
    });
    const semantic = store.memory.semantic as unknown as {
      rememberWithEmbedding(
        f: import('@graphorin/core').Fact,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
    };
    await expect(
      semantic.rememberWithEmbedding(
        {
          id: 'fbad',
          kind: 'semantic',
          userId: 'alex',
          sensitivity: 'internal',
          text: 'bad',
          createdAt: new Date().toISOString(),
        },
        { embedding: { embedderId: meta.id, vector: new Float32Array(7) } },
      ),
    ).rejects.toThrow(/embedding dim mismatch/);
    await store.close();
  });

  it('rejects writes that reference an unregistered embedder_id', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-vec-bad-'));
    const store = await createSqliteStore({
      path: `${dir}/db.sqlite`,
    });
    await store.init();
    const semantic = store.memory.semantic as unknown as {
      rememberWithEmbedding(
        f: import('@graphorin/core').Fact,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
    };
    await expect(
      semantic.rememberWithEmbedding(
        {
          id: 'f-bad',
          kind: 'semantic',
          userId: 'alex',
          sensitivity: 'internal',
          text: 'unknown embedder',
          createdAt: new Date().toISOString(),
        },
        {
          embedding: {
            embedderId: 'totally:unknown@1',
            vector: new Float32Array([1, 2, 3]),
          },
        },
      ),
    ).rejects.toThrow(/unknown embedder_id/);
    await store.close();
  });
});

describe('MRET-9 - KNN over-fetch + tombstone hygiene', () => {
  it('a minority user gets their full topK despite a dominant user saturating the slice', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-vec-mret9-'));
    const store = await createSqliteStore({ path: `${dir}/db.sqlite` });
    await store.init();
    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:m@4',
      embedderKind: 'transformersjs',
      model: 'm',
      dim: 4,
      configHash: 'cfg-mret9',
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
      ): Promise<ReadonlyArray<{ record: { id: string } }>>;
      forget(id: string, reason?: string): Promise<void>;
    };
    const target = new Float32Array([1, 0, 0, 0]);
    // 95 dominant-user vectors NEAR the query (they fill any small slice)…
    for (let i = 0; i < 95; i += 1) {
      await semantic.rememberWithEmbedding(
        {
          id: `dom-${i}`,
          kind: 'semantic',
          userId: 'dominant',
          sensitivity: 'internal',
          text: `dominant fact ${i}`,
          createdAt: new Date().toISOString(),
        },
        {
          embedding: {
            embedderId: meta.id,
            vector: new Float32Array([1, 0.001 * i, 0, 0]),
          },
        },
      );
    }
    // …and 5 minority-user vectors strictly FARTHER from the query.
    for (let i = 0; i < 5; i += 1) {
      await semantic.rememberWithEmbedding(
        {
          id: `min-${i}`,
          kind: 'semantic',
          userId: 'minority',
          sensitivity: 'internal',
          text: `minority fact ${i}`,
          createdAt: new Date().toISOString(),
        },
        {
          embedding: {
            embedderId: meta.id,
            vector: new Float32Array([0, 1, 0.05 * i, 0]),
          },
        },
      );
    }
    // Pre-fix: k = topK bound the GLOBAL slice to the 5 nearest rows -
    // all dominant - and the minority scope filtered down to zero.
    const hits = await semantic.searchVector({ userId: 'minority' }, target, meta.id, 5);
    expect(hits.length).toBe(5);
    expect(hits.every((h) => h.record.id.startsWith('min-'))).toBe(true);

    // Tombstoned facts release their k-nearest slots (vec0 row deleted).
    const before = store.connection.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM ${meta.vecTableFacts}`,
    );
    await semantic.forget('dom-0');
    const after = store.connection.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM ${meta.vecTableFacts}`,
    );
    expect((before?.n ?? 0) - (after?.n ?? 0)).toBe(1);
    await store.close();
  });
});

describe('store-03 - episode KNN over-fetch (MRET-9 ported)', () => {
  it('a minority user gets their full topK of EPISODES despite a dominant user saturating the slice', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-vec-store03-'));
    const store = await createSqliteStore({ path: `${dir}/db.sqlite` });
    await store.init();
    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:m@4',
      embedderKind: 'transformersjs',
      model: 'm',
      dim: 4,
      configHash: 'cfg-store03',
    });
    const episodic = store.memory.episodic as unknown as {
      putWithEmbedding(
        e: import('@graphorin/core').Episode,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
      searchVector(
        scope: { userId: string },
        embedding: Float32Array,
        embedderId: string,
        topK: number,
      ): Promise<ReadonlyArray<{ record: { id: string } }>>;
    };
    const now = new Date().toISOString();
    const makeEpisode = (id: string, userId: string): import('@graphorin/core').Episode => ({
      id,
      kind: 'episodic',
      userId,
      sensitivity: 'internal',
      summary: `episode ${id}`,
      startedAt: now,
      endedAt: now,
      createdAt: now,
    });
    // 95 dominant-user vectors NEAR the query fill any small k slice…
    for (let i = 0; i < 95; i += 1) {
      await episodic.putWithEmbedding(makeEpisode(`dom-${i}`, 'dominant'), {
        embedding: { embedderId: meta.id, vector: new Float32Array([1, 0.001 * i, 0, 0]) },
      });
    }
    // …and 5 minority-user vectors strictly FARTHER from it.
    for (let i = 0; i < 5; i += 1) {
      await episodic.putWithEmbedding(makeEpisode(`min-${i}`, 'minority'), {
        embedding: { embedderId: meta.id, vector: new Float32Array([0, 1, 0.001 * i, 0]) },
      });
    }
    // Pre-fix: `topK` bound directly as the GLOBAL vec0 k - the
    // dominant user's 95 near vectors filled the k=5 slice and the
    // minority scope filter starved the result to zero.
    const hits = await episodic.searchVector(
      { userId: 'minority' },
      new Float32Array([1, 0, 0, 0]),
      meta.id,
      5,
    );
    expect(hits).toHaveLength(5);
    expect(hits.every((h) => h.record.id.startsWith('min-'))).toBe(true);
    await store.close();
  });

  // W-153: Float32Array VIEWS with a non-zero byteOffset (the standard
  // subarray idiom of batched embedders) must serialize to exactly
  // their own bytes. Pre-fix, Buffer.from(vec.buffer) serialized the
  // WHOLE underlying buffer: dim checks passed (vector.length is the
  // view length) and the failure surfaced later as an opaque vec0
  // dimension error.
  it('facts + episodes accept Float32Array views with byteOffset != 0 (W-153)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-vec-'));
    const store = await createSqliteStore({ path: `${dir}/db.sqlite` });
    await store.init();
    const meta = store.embeddings.registerOrReturn({
      id: 'stub:view@4',
      embedderKind: 'stub',
      model: 'view',
      dim: 4,
      configHash: 'cfg-view',
    });

    // One big batch buffer holding two 4-dim vectors; the second one
    // starts at byteOffset 16.
    const batch = new Float32Array([9, 9, 9, 9, 1, 0, 0, 0]);
    const view = batch.subarray(4); // [1, 0, 0, 0], byteOffset 16
    expect(view.byteOffset).toBe(16);

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
      ): Promise<ReadonlyArray<{ record: { id: string } }>>;
    };
    await semantic.rememberWithEmbedding(
      {
        id: 'view-fact',
        kind: 'semantic',
        userId: 'alex',
        sensitivity: 'internal',
        text: 'stored through a view',
        createdAt: new Date().toISOString(),
      },
      { embedding: { embedderId: meta.id, vector: view } },
    );

    // Query with ANOTHER non-zero-offset view.
    const queryBatch = new Float32Array([7, 7, 7, 7, 1, 0, 0, 0]);
    const queryView = queryBatch.subarray(4);
    const hits = await semantic.searchVector({ userId: 'alex' }, queryView, meta.id, 3);
    expect(hits.map((h) => h.record.id)).toContain('view-fact');

    // Episodes side: putWithEmbedding + searchVector with views.
    const episodic = store.memory.episodic as unknown as {
      putWithEmbedding(
        e: import('@graphorin/core').Episode,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
      searchVector(
        scope: { userId: string },
        embedding: Float32Array,
        embedderId: string,
        topK: number,
      ): Promise<ReadonlyArray<{ record: { id: string } }>>;
    };
    await episodic.putWithEmbedding(
      {
        id: 'view-episode',
        kind: 'episodic',
        userId: 'alex',
        sensitivity: 'internal',
        summary: 'stored through a view',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { embedding: { embedderId: meta.id, vector: view } },
    );
    const epHits = await episodic.searchVector({ userId: 'alex' }, queryView, meta.id, 3);
    expect(epHits.map((h) => h.record.id)).toContain('view-episode');

    await store.close();
  });
});
