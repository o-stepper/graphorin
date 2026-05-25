import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Episode, Fact, MemoryHit, SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const SCOPE: SessionScope = { userId: 'alex' };

// Validity windows: A is closed [Jan, Jun); B is open [Jun, ∞).
const A_FROM = '2024-01-01T00:00:00.000Z';
const A_TO = '2024-06-01T00:00:00.000Z';
const B_FROM = '2024-06-01T00:00:00.000Z';
const BEFORE = '2024-03-01T00:00:00.000Z'; // inside A's interval, before B started
const AFTER = '2024-09-01T00:00:00.000Z'; // after A closed, inside B's open interval

async function makeStore(opts: { vec?: boolean } = {}): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-asof-'));
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    ...(opts.vec === true ? {} : { skipSqliteVec: true }),
  });
  await store.init();
  return store;
}

function factA(): Fact {
  return {
    id: 'fA',
    kind: 'semantic',
    userId: 'alex',
    sensitivity: 'internal',
    text: 'Residence is Berlin.',
    validFrom: A_FROM,
    validTo: A_TO,
    createdAt: A_FROM,
  };
}

function factB(extra: Partial<Fact> = {}): Fact {
  return {
    id: 'fB',
    kind: 'semantic',
    userId: 'alex',
    sensitivity: 'internal',
    text: 'Residence is Munich.',
    validFrom: B_FROM,
    createdAt: B_FROM,
    ...extra,
  };
}

describe('semantic as_of point-in-time queries (FTS)', () => {
  it('returns only facts whose validity interval contains the instant', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(factA());
    await store.memory.semantic.remember(factB());

    const before = await store.memory.semantic.search(SCOPE, { query: 'Residence', asOf: BEFORE });
    expect(before.map((h) => h.record.id)).toEqual(['fA']);

    const after = await store.memory.semantic.search(SCOPE, { query: 'Residence', asOf: AFTER });
    expect(after.map((h) => h.record.id)).toEqual(['fB']);

    await store.close();
  });

  it('is a no-op when asOf is absent (regression-safe)', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(factA());
    await store.memory.semantic.remember(factB());

    const all = await store.memory.semantic.search(SCOPE, { query: 'Residence' });
    expect(new Set(all.map((h) => h.record.id))).toEqual(new Set(['fA', 'fB']));
    expect(all.length).toBe(2);

    await store.close();
  });

  it('throws on an invalid asOf timestamp', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(factA());
    await expect(
      store.memory.semantic.search(SCOPE, { query: 'Residence', asOf: 'not-a-date' }),
    ).rejects.toThrow(/invalid ISO-8601/);
    await store.close();
  });
});

describe('semantic as_of point-in-time queries (vector)', () => {
  it('filters KNN candidates by validity interval', async () => {
    const store = await makeStore({ vec: true });
    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:e5@8',
      embedderKind: 'transformersjs',
      model: 'e5',
      dim: 8,
      configHash: 'cfg',
    });
    const semantic = store.memory.semantic as unknown as {
      rememberWithEmbedding(
        f: Fact,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
      searchVector(
        scope: SessionScope,
        embedding: Float32Array,
        embedderId: string,
        topK: number,
        asOf?: string,
      ): Promise<ReadonlyArray<MemoryHit<Fact>>>;
    };
    const vA = new Float32Array([1, 0, 0, 0, 0, 0, 0, 0]);
    const vB = new Float32Array([0, 1, 0, 0, 0, 0, 0, 0]);
    await semantic.rememberWithEmbedding(factA(), {
      embedding: { embedderId: meta.id, vector: vA },
    });
    await semantic.rememberWithEmbedding(factB(), {
      embedding: { embedderId: meta.id, vector: vB },
    });

    const query = new Float32Array([0.5, 0.5, 0, 0, 0, 0, 0, 0]);
    const before = await semantic.searchVector(SCOPE, query, meta.id, 10, BEFORE);
    expect(before.map((h) => h.record.id)).toEqual(['fA']);
    const after = await semantic.searchVector(SCOPE, query, meta.id, 10, AFTER);
    expect(after.map((h) => h.record.id)).toEqual(['fB']);

    await store.close();
  });
});

describe('semantic historyOf supersede chain', () => {
  it('returns the ordered chain incl. superseded + soft-deleted rows', async () => {
    const store = await makeStore();
    const semantic = store.memory.semantic as unknown as {
      historyOf(scope: SessionScope, factId: string): Promise<ReadonlyArray<Fact>>;
    };
    await store.memory.semantic.remember(factA());
    // B supersedes A; the store sets A.superseded_by = B.id and persists B
    // (already carrying supersedes = A.id), linking the chain in both directions.
    await store.memory.semantic.supersede('fA', factB({ supersedes: 'fA' }), 'moved to Munich');

    const fromNew = await semantic.historyOf(SCOPE, 'fB');
    expect(fromNew.map((f) => f.id)).toEqual(['fA', 'fB']);
    // The walk resolves the full chain from either end.
    const fromOld = await semantic.historyOf(SCOPE, 'fA');
    expect(fromOld.map((f) => f.id)).toEqual(['fA', 'fB']);

    // History must surface superseded rows even after a soft-delete.
    await store.memory.semantic.forget('fA', 'no-longer-current');
    const afterForget = await semantic.historyOf(SCOPE, 'fB');
    expect(afterForget.map((f) => f.id)).toEqual(['fA', 'fB']);

    // Unknown id → empty chain (never throws).
    expect(await semantic.historyOf(SCOPE, 'does-not-exist')).toEqual([]);

    await store.close();
  });
});

function episode(id: string, startedAt: string, endedAt: string, summary: string): Episode {
  return {
    id,
    kind: 'episodic',
    userId: 'alex',
    sensitivity: 'internal',
    summary,
    startedAt,
    endedAt,
    createdAt: startedAt,
  };
}

describe('episodic as_of point-in-time queries', () => {
  it('FTS returns only episodes that had started by the instant', async () => {
    const store = await makeStore();
    await store.memory.episodic.put(episode('e1', A_FROM, A_TO, 'Trip planning for Berlin'));
    await store.memory.episodic.put(episode('e2', AFTER, AFTER, 'Trip planning for Munich'));

    const early = await store.memory.episodic.search(SCOPE, { query: 'Trip', asOf: BEFORE });
    expect(early.map((h) => h.record.id)).toEqual(['e1']);

    const late = await store.memory.episodic.search(SCOPE, {
      query: 'Trip',
      asOf: '2024-12-01T00:00:00.000Z',
    });
    expect(new Set(late.map((h) => h.record.id))).toEqual(new Set(['e1', 'e2']));

    const all = await store.memory.episodic.search(SCOPE, { query: 'Trip' });
    expect(all.length).toBe(2);

    await store.close();
  });

  it('vector KNN filters candidates by started_at <= asOf', async () => {
    const store = await makeStore({ vec: true });
    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:e5@8',
      embedderKind: 'transformersjs',
      model: 'e5',
      dim: 8,
      configHash: 'cfg',
    });
    const ep = store.memory.episodic as unknown as {
      putWithEmbedding(
        e: Episode,
        opts: { embedding: { embedderId: string; vector: Float32Array } },
      ): Promise<void>;
      searchVector(
        scope: SessionScope,
        embedding: Float32Array,
        embedderId: string,
        topK: number,
        asOf?: string,
      ): Promise<ReadonlyArray<MemoryHit<Episode>>>;
    };
    await ep.putWithEmbedding(episode('e1', A_FROM, A_TO, 'Trip to Berlin'), {
      embedding: { embedderId: meta.id, vector: new Float32Array([1, 0, 0, 0, 0, 0, 0, 0]) },
    });
    await ep.putWithEmbedding(episode('e2', AFTER, AFTER, 'Trip to Munich'), {
      embedding: { embedderId: meta.id, vector: new Float32Array([0, 1, 0, 0, 0, 0, 0, 0]) },
    });
    const query = new Float32Array([0.5, 0.5, 0, 0, 0, 0, 0, 0]);
    const early = await ep.searchVector(SCOPE, query, meta.id, 10, BEFORE);
    expect(early.map((h) => h.record.id)).toEqual(['e1']);

    await store.close();
  });
});
