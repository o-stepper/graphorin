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
