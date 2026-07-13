/**
 * Wave-D D5 (MST-12 / item 10 steps 3-4) - store-side migration
 * support: the persisted resumable cursor over the revived
 * `migration_state` table, the store-side `nextBatch` pager, retired
 * vec-table reclaim (freelist grows), and the linear-fallback vector
 * mode (top-k parity with vec0 + the mode-mismatch guard).
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Fact } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const DIM = 4;

function vec(values: ReadonlyArray<number>): Float32Array {
  return new Float32Array(values);
}

async function makeStore(overrides: Record<string, unknown> = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-emig-'));
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    // A migration necessarily has two live embedders in flight.
    embedderPolicy: 'multi-active',
    ...overrides,
  } as never);
  await store.init();
  return { store, dir };
}

function registerEmbedder(store: GraphorinSqliteStore, id: string): void {
  store.embeddings.registerOrReturn({
    id,
    embedderKind: 'stub',
    model: id,
    dim: DIM,
    configHash: `cfg-${id}`,
  });
}

async function seedFact(store: GraphorinSqliteStore, id: string, text: string, embedderId: string) {
  const semantic = store.memory.semantic as unknown as {
    rememberWithEmbedding(fact: Fact, options: unknown): Promise<void>;
  };
  await semantic.rememberWithEmbedding(
    {
      id,
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text,
      createdAt: new Date().toISOString(),
    } as Fact,
    { embedding: { embedderId, vector: vec([1, 0, 0, 0]) } },
  );
}

describe('EmbedderMigrationStateRepository (migration_state revived)', () => {
  it('create / findResumable / update round-trip survives reopen (cross-process cursor)', async () => {
    const { store, dir } = await makeStore({ skipSqliteVec: true });
    // migration_state carries FKs into embedding_meta.
    registerEmbedder(store, 'stub:src@4');
    registerEmbedder(store, 'stub:tgt@4');
    await store.embedderMigration.state.create({
      id: 'mig-1',
      sourceEmbedder: 'stub:src@4',
      targetEmbedder: 'stub:tgt@4',
      strategy: 'auto-migrate',
      totalRecords: 100,
    });
    await store.embedderMigration.state.update('mig-1', {
      processed: 40,
      lastRecordId: 'fact:f-40',
    });
    await store.close();

    // Simulated process restart: same file, fresh handles.
    const reopened = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
    await reopened.init();
    const resumable = await reopened.embedderMigration.state.findResumable(
      'stub:src@4',
      'stub:tgt@4',
    );
    expect(resumable?.id).toBe('mig-1');
    expect(resumable?.processed).toBe(40);
    expect(resumable?.lastRecordId).toBe('fact:f-40');

    await reopened.embedderMigration.state.update('mig-1', { status: 'committed' });
    expect(
      await reopened.embedderMigration.state.findResumable('stub:src@4', 'stub:tgt@4'),
    ).toBeNull();
  });
});

describe('createMigrationBatcher (store-side pager)', () => {
  it('pages live rows in id order, re-embeds into the target sidecar and flips embedder_id', async () => {
    const { store } = await makeStore({});
    registerEmbedder(store, 'stub:src@4');
    registerEmbedder(store, 'stub:tgt@4');
    await seedFact(store, 'f-a', 'alpha', 'stub:src@4');
    await seedFact(store, 'f-b', 'beta', 'stub:src@4');
    await seedFact(store, 'f-c', 'gamma', 'stub:src@4');

    const first = await store.embedderMigration.nextBatch({
      kind: 'fact',
      source: 'stub:src@4',
      target: 'stub:tgt@4',
      batchSize: 2,
      cursor: null,
    });
    expect(first.rows.map((r) => r.id)).toEqual(['f-a', 'f-b']);
    expect(first.nextCursor).toBe('f-b');
    for (const row of first.rows) await row.write(vec([0, 1, 0, 0]));

    const second = await store.embedderMigration.nextBatch({
      kind: 'fact',
      source: 'stub:src@4',
      target: 'stub:tgt@4',
      batchSize: 2,
      cursor: first.nextCursor,
    });
    expect(second.rows.map((r) => r.id)).toEqual(['f-c']);
    expect(second.nextCursor).toBeNull();
    for (const row of second.rows) await row.write(vec([0, 1, 0, 0]));

    const count = (sql: string) => store.connection.get<{ n: number }>(sql)?.n ?? -1;
    const srcMeta = store.embeddings.get('stub:src@4');
    const tgtMeta = store.embeddings.get('stub:tgt@4');
    expect(count(`SELECT COUNT(*) AS n FROM ${tgtMeta?.vecTableFacts}`)).toBe(3);
    expect(count(`SELECT COUNT(*) AS n FROM ${srcMeta?.vecTableFacts}`)).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM facts WHERE embedder_id = 'stub:tgt@4'")).toBe(3);
    // Messages: nothing to migrate (session vector search unimplemented).
    const messages = await store.embedderMigration.nextBatch({
      kind: 'message',
      source: 'stub:src@4',
      target: 'stub:tgt@4',
      batchSize: 10,
      cursor: null,
    });
    expect(messages.rows).toHaveLength(0);
  });
});

describe('dropRetiredVectorTables (space reclaim)', () => {
  it('drops only retired embedders tables and frees pages', async () => {
    const { store } = await makeStore({});
    registerEmbedder(store, 'stub:src@4');
    registerEmbedder(store, 'stub:tgt@4');
    for (let i = 0; i < 50; i++) {
      await seedFact(store, `f-${String(i).padStart(3, '0')}`, `fact ${i}`, 'stub:src@4');
    }
    const srcMeta = store.embeddings.get('stub:src@4');
    const tgtMeta = store.embeddings.get('stub:tgt@4');
    store.embeddings.retire('stub:src@4');

    const before = store.connection.pragma('freelist_count', { simple: true }) as number;
    const { dropped } = store.embedderMigration.dropRetiredVectorTables();
    expect(dropped).toContain(srcMeta?.vecTableFacts);
    expect(dropped).not.toContain(tgtMeta?.vecTableFacts);
    const after = store.connection.pragma('freelist_count', { simple: true }) as number;
    expect(after).toBeGreaterThan(before);
    // Idempotent: a second sweep drops nothing.
    expect(store.embedderMigration.dropRetiredVectorTables().dropped).toHaveLength(0);
  });
});

describe('linear-fallback vector mode (wave-D D5)', () => {
  const failingLoader = () => {
    throw new Error('native build unavailable');
  };

  it('serves the same top-k as vec0 on a small fixture', async () => {
    const points: Array<[string, ReadonlyArray<number>]> = [
      ['p-north', [1, 0, 0, 0]],
      ['p-east', [0, 1, 0, 0]],
      ['p-north-east', [0.7, 0.7, 0, 0]],
      ['p-south', [-1, 0, 0, 0]],
      ['p-up', [0, 0, 1, 0]],
    ];
    const query = vec([1, 0.1, 0, 0]);

    // vec0 leg.
    const { store: vecStore } = await makeStore({});
    registerEmbedder(vecStore, 'stub:e@4');
    for (const [id, values] of points) {
      const semantic = vecStore.memory.semantic as unknown as {
        rememberWithEmbedding(fact: Fact, options: unknown): Promise<void>;
      };
      await semantic.rememberWithEmbedding(
        {
          id,
          kind: 'semantic',
          userId: 'alex',
          sensitivity: 'internal',
          text: id,
          createdAt: new Date().toISOString(),
        } as Fact,
        { embedding: { embedderId: 'stub:e@4', vector: vec(values) } },
      );
    }
    const vecHits = await (
      vecStore.memory.semantic as unknown as {
        searchVector(
          scope: { userId: string },
          embedding: Float32Array,
          embedderId: string,
          topK: number,
        ): Promise<ReadonlyArray<{ record: { id: string } }>>;
      }
    ).searchVector({ userId: 'alex' }, query, 'stub:e@4', 3);

    // Fallback leg (separate database - modes must not mix).
    const { store: fbStore } = await makeStore({
      loadVecExtension: failingLoader,
      onMissingSqliteVec: 'linear-fallback',
    });
    registerEmbedder(fbStore, 'stub:e@4');
    for (const [id, values] of points) {
      const semantic = fbStore.memory.semantic as unknown as {
        rememberWithEmbedding(fact: Fact, options: unknown): Promise<void>;
      };
      await semantic.rememberWithEmbedding(
        {
          id,
          kind: 'semantic',
          userId: 'alex',
          sensitivity: 'internal',
          text: id,
          createdAt: new Date().toISOString(),
        } as Fact,
        { embedding: { embedderId: 'stub:e@4', vector: vec(values) } },
      );
    }
    const fbHits = await (
      fbStore.memory.semantic as unknown as {
        searchVector(
          scope: { userId: string },
          embedding: Float32Array,
          embedderId: string,
          topK: number,
        ): Promise<ReadonlyArray<{ record: { id: string } }>>;
      }
    ).searchVector({ userId: 'alex' }, query, 'stub:e@4', 3);

    expect(fbHits.map((h) => h.record.id)).toEqual(vecHits.map((h) => h.record.id));
    expect(fbHits.map((h) => h.record.id)).toEqual(['p-north', 'p-north-east', 'p-east']);
  });

  it('without the policy the missing peer still fails hard; mode mismatch is guarded', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-emig-guard-'));
    await expect(
      createSqliteStore({ path: `${dir}/hard.sqlite`, loadVecExtension: failingLoader } as never),
    ).rejects.toThrow();

    // Build a fallback-mode database, then reopen it WITH vec0: the
    // manager must refuse the plain sidecar tables loudly.
    const fb = await createSqliteStore({
      path: `${dir}/fallback.sqlite`,
      loadVecExtension: failingLoader,
      onMissingSqliteVec: 'linear-fallback',
    });
    await fb.init();
    registerEmbedder(fb, 'stub:e@4');
    await seedFact(fb, 'f-1', 'one', 'stub:e@4');
    await fb.close();

    await expect(
      (async () => {
        const reopened = await createSqliteStore({ path: `${dir}/fallback.sqlite` });
        await reopened.init();
        return reopened;
      })(),
    ).rejects.toThrow(/linear-fallback mode/);
  });
});
