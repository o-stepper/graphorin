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

  it('a default read behaves as asOf=now: closed intervals are excluded (memory-retrieval-01)', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(factA());
    await store.memory.semantic.remember(factB());

    // fA's interval closed in 2024 - it must not surface as current.
    const current = await store.memory.semantic.search(SCOPE, { query: 'Residence' });
    expect(current.map((h) => h.record.id)).toEqual(['fB']);

    await store.close();
  });

  it('includeSuperseded restores the full history for inspector paths', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(factA());
    await store.memory.semantic.remember(factB());

    const all = await store.memory.semantic.search(SCOPE, {
      query: 'Residence',
      includeSuperseded: true,
    });
    expect(new Set(all.map((h) => h.record.id))).toEqual(new Set(['fA', 'fB']));
    expect(all.length).toBe(2);

    await store.close();
  });

  it('supersede() removes the old fact from default recall (the fact_supersede promise)', async () => {
    const store = await makeStore();
    const oldFact: Fact = {
      id: 'f-old',
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'Residence is Berlin.',
      createdAt: new Date().toISOString(),
    };
    await store.memory.semantic.remember(oldFact);
    const newFact: Fact = {
      id: 'f-new',
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'Residence is Paris.',
      createdAt: new Date().toISOString(),
    };
    await store.memory.semantic.supersede('f-old', newFact, 'moved');

    const current = await store.memory.semantic.search(SCOPE, { query: 'Residence' });
    expect(current.map((h) => h.record.id)).toEqual(['f-new']);

    // The old fact stays reachable for audit / history.
    const history = await store.memory.semantic.search(SCOPE, {
      query: 'Residence',
      includeSuperseded: true,
    });
    expect(new Set(history.map((h) => h.record.id))).toEqual(new Set(['f-old', 'f-new']));

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

describe('semantic supersede closes the old validity interval (P0-3)', () => {
  it('sets valid_to on supersede so asOf excludes the superseded fact', async () => {
    const store = await makeStore();
    const sem = store.memory.semantic;
    // Open-ended A: validFrom set, valid_to NULL.
    await sem.remember({
      id: 'oldF',
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'Primary language is Python.',
      validFrom: A_FROM,
      createdAt: A_FROM,
    });
    // B replaces A, taking effect at B_FROM.
    await sem.supersede(
      'oldF',
      {
        id: 'newF',
        kind: 'semantic',
        userId: 'alex',
        sensitivity: 'internal',
        text: 'Primary language is Rust.',
        validFrom: B_FROM,
        supersedes: 'oldF',
        createdAt: B_FROM,
      },
      'switched to Rust',
    );

    // The previously-open interval is now closed exactly at B's validFrom.
    const rows = store.connection.all<{ valid_to: number | null; superseded_by: string | null }>(
      'SELECT valid_to, superseded_by FROM facts WHERE id = ?',
      ['oldF'],
    );
    expect(rows[0]?.valid_to).toBe(Date.parse(B_FROM));
    expect(rows[0]?.superseded_by).toBe('newF');

    // The supersede is recorded in the audit log.
    const audit = store.connection.all<{ event: string }>(
      "SELECT event FROM memory_history WHERE memory_id = ? AND event = 'SUPERSEDE'",
      ['oldF'],
    );
    expect(audit).toHaveLength(1);

    // asOf AFTER the switch: only the new fact is live (the old interval closed).
    const after = await sem.search(SCOPE, { query: 'language', asOf: AFTER });
    expect(after.map((h) => h.record.id)).toEqual(['newF']);

    // asOf BEFORE the switch (inside A's now-closed interval): the old fact is live.
    const before = await sem.search(SCOPE, { query: 'language', asOf: BEFORE });
    expect(before.map((h) => h.record.id)).toEqual(['oldF']);

    await store.close();
  });

  it('never clobbers an interval the caller already closed explicitly', async () => {
    const store = await makeStore();
    const sem = store.memory.semantic;
    // A is created already closed at A_TO.
    await sem.remember(factA());
    await sem.supersede('fA', factB({ supersedes: 'fA' }), 'moved');
    const rows = store.connection.all<{ valid_to: number | null }>(
      'SELECT valid_to FROM facts WHERE id = ?',
      ['fA'],
    );
    // COALESCE keeps the explicit A_TO close - supersede does not move it.
    expect(rows[0]?.valid_to).toBe(Date.parse(A_TO));
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
