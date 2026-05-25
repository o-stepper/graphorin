import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Episode, Fact, MemoryHit, MemoryStatus, SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const SCOPE: SessionScope = { userId: 'alex' };

async function makeStore(opts: { vec?: boolean } = {}): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-quarantine-'));
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    ...(opts.vec === true ? {} : { skipSqliteVec: true }),
  });
  await store.init();
  return store;
}

function fact(id: string, text: string, extra: Partial<Fact> = {}): Fact {
  return {
    id,
    kind: 'semantic',
    userId: 'alex',
    sensitivity: 'internal',
    text,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...extra,
  };
}

// Narrow cast to reach the P1-4 storage extensions on the concrete adapter.
function ext(store: GraphorinSqliteStore): {
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
    includeQuarantined?: boolean,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>>;
  setStatus(factId: string, status: MemoryStatus, reason?: string): Promise<void>;
} {
  return store.memory.semantic as unknown as ReturnType<typeof ext>;
}

describe('fact provenance + quarantine (FTS)', () => {
  it('round-trips provenance + status through insert → rowToFact', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(
      fact('f1', 'extracted detail about the user', {
        provenance: 'extraction',
        status: 'quarantined',
      }),
    );
    const [hit] = await store.memory.semantic.search(SCOPE, {
      query: 'extracted',
      includeQuarantined: true,
    });
    expect(hit?.record.provenance).toBe('extraction');
    expect(hit?.record.status).toBe('quarantined');
    await store.close();
  });

  it('excludes quarantined facts from default search; includes them on demand', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(
      fact('active', 'residence is Lisbon', { status: 'active' }),
    );
    await store.memory.semantic.remember(
      fact('quar', 'residence is Lisbon too', {
        provenance: 'extraction',
        status: 'quarantined',
      }),
    );

    const def = await store.memory.semantic.search(SCOPE, { query: 'residence' });
    expect(def.map((h) => h.record.id)).toEqual(['active']);

    const all = await store.memory.semantic.search(SCOPE, {
      query: 'residence',
      includeQuarantined: true,
    });
    expect(new Set(all.map((h) => h.record.id))).toEqual(new Set(['active', 'quar']));
    await store.close();
  });

  it('a fact remembered without an explicit status defaults to active (recall-visible)', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(fact('f1', 'plain fact about hiking'));
    const def = await store.memory.semantic.search(SCOPE, { query: 'hiking' });
    expect(def.map((h) => h.record.id)).toEqual(['f1']);
    expect(def[0]?.record.status).toBe('active');
    await store.close();
  });

  it('setStatus promotes a quarantined fact to active and writes a memory_history audit row', async () => {
    const store = await makeStore();
    await store.memory.semantic.remember(
      fact('f1', 'quarantined fact about espresso', {
        provenance: 'extraction',
        status: 'quarantined',
      }),
    );
    // Hidden from default recall while quarantined.
    expect((await store.memory.semantic.search(SCOPE, { query: 'espresso' })).length).toBe(0);

    await ext(store).setStatus('f1', 'active', 'reviewed by operator');

    // Now eligible for default recall.
    const after = await store.memory.semantic.search(SCOPE, { query: 'espresso' });
    expect(after.map((h) => h.record.id)).toEqual(['f1']);
    expect(after[0]?.record.status).toBe('active');

    // Promotion is audited.
    const audit = store.connection.all<{ event: string; memory_id: string; new_value: string }>(
      "SELECT event, memory_id, new_value FROM memory_history WHERE memory_id = ? AND event = 'VALIDATE'",
      ['f1'],
    );
    expect(audit.length).toBe(1);
    expect(audit[0]?.new_value).toBe('reviewed by operator');

    // Re-quarantine round-trips through the same path (audited as QUARANTINE).
    await ext(store).setStatus('f1', 'quarantined');
    expect((await store.memory.semantic.search(SCOPE, { query: 'espresso' })).length).toBe(0);
    const requar = store.connection.all<{ event: string }>(
      "SELECT event FROM memory_history WHERE memory_id = ? AND event = 'QUARANTINE'",
      ['f1'],
    );
    expect(requar.length).toBe(1);
    await store.close();
  });
});

describe('fact provenance + quarantine (vector)', () => {
  it('KNN excludes quarantined facts by default; includes them on demand', async () => {
    const store = await makeStore({ vec: true });
    const meta = store.embeddings.registerOrReturn({
      id: 'transformersjs:e5@8',
      embedderKind: 'transformersjs',
      model: 'e5',
      dim: 8,
      configHash: 'cfg',
    });
    const e = ext(store);
    await e.rememberWithEmbedding(fact('active', 'active vectorized fact', { status: 'active' }), {
      embedding: { embedderId: meta.id, vector: new Float32Array([1, 0, 0, 0, 0, 0, 0, 0]) },
    });
    await e.rememberWithEmbedding(
      fact('quar', 'quarantined vectorized fact', {
        provenance: 'extraction',
        status: 'quarantined',
      }),
      { embedding: { embedderId: meta.id, vector: new Float32Array([0, 1, 0, 0, 0, 0, 0, 0]) } },
    );
    const query = new Float32Array([0.5, 0.5, 0, 0, 0, 0, 0, 0]);

    const def = await e.searchVector(SCOPE, query, meta.id, 10);
    expect(def.map((h) => h.record.id)).toEqual(['active']);

    const all = await e.searchVector(SCOPE, query, meta.id, 10, undefined, true);
    expect(new Set(all.map((h) => h.record.id))).toEqual(new Set(['active', 'quar']));
    await store.close();
  });
});

describe('episode quarantine (FTS)', () => {
  it('excludes quarantined episodes from default search; includes them on demand', async () => {
    const store = await makeStore();
    const episode = (id: string, status: MemoryStatus): Episode => ({
      id,
      kind: 'episodic',
      userId: 'alex',
      sensitivity: 'internal',
      summary: 'Trip planning session',
      startedAt: '2024-01-01T00:00:00.000Z',
      endedAt: '2024-01-01T01:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      status,
    });
    await store.memory.episodic.put(episode('active', 'active'));
    await store.memory.episodic.put(episode('quar', 'quarantined'));

    const def = await store.memory.episodic.search(SCOPE, { query: 'Trip' });
    expect(def.map((h) => h.record.id)).toEqual(['active']);

    const all = await store.memory.episodic.search(SCOPE, {
      query: 'Trip',
      includeQuarantined: true,
    });
    expect(new Set(all.map((h) => h.record.id))).toEqual(new Set(['active', 'quar']));
    await store.close();
  });
});
