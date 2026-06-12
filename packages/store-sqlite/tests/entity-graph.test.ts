/**
 * Tests for the P2-1 relation-graph store (migration 016): the s/p/o
 * write-path round-trip, canonical-entity find-or-create + dedup,
 * auditable + reversible merges, and the one-hop recursive-CTE
 * expansion (including merge-canonicalisation of the traversal).
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Fact, SessionScope } from '@graphorin/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { openConnection } from '../src/connection.js';
import { EmbeddingMetaRepository } from '../src/embedding-meta-repo.js';
import { SqliteMemoryStore } from '../src/memory-store.js';
import { runMigrations } from '../src/migrations/runner.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

async function makeStore(): Promise<SqliteMemoryStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-entity-graph-'));
  const conn = await openConnection({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  runMigrations(conn);
  const store = new SqliteMemoryStore(conn, new EmbeddingMetaRepository(conn, 'multi-active'));
  await store.init();
  return store;
}

let counter = 0;
function mkFact(over: Partial<Fact> = {}): Fact {
  counter += 1;
  const now = new Date().toISOString();
  return {
    id: `fact_${counter}`,
    kind: 'semantic',
    userId: SCOPE.userId,
    sessionId: SCOPE.sessionId,
    sensitivity: 'internal',
    text: 'a durable fact',
    createdAt: now,
    updatedAt: now,
    ...over,
  } as Fact;
}

describe('P2-1 s/p/o write-path round-trip', () => {
  let store: SqliteMemoryStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('persists + surfaces subject / predicate / object (no longer inert)', async () => {
    await store.semantic.remember(
      mkFact({
        id: 'f_spo',
        text: 'Anna recommended a great sushi restaurant',
        subject: 'Anna',
        predicate: 'recommended',
        object: 'sushi restaurant',
      }),
    );
    const hits = await store.semantic.search(SCOPE, { query: 'sushi', topK: 5 });
    const got = hits.find((h) => h.record.id === 'f_spo')?.record;
    expect(got).toBeDefined();
    expect(got?.subject).toBe('Anna');
    expect(got?.predicate).toBe('recommended');
    expect(got?.object).toBe('sushi restaurant');
  });

  it('leaves s/p/o undefined for a plain free-text fact', async () => {
    await store.semantic.remember(mkFact({ id: 'f_plain', text: 'plain fact about coffee' }));
    const hits = await store.semantic.search(SCOPE, { query: 'coffee', topK: 5 });
    const got = hits.find((h) => h.record.id === 'f_plain')?.record;
    expect(got?.subject).toBeUndefined();
    expect(got?.predicate).toBeUndefined();
    expect(got?.object).toBeUndefined();
  });
});

describe('P2-1 canonical entities', () => {
  let store: SqliteMemoryStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('upsert is find-or-create: same normalized name returns the same id', async () => {
    const a1 = await store.graph.upsertEntity(SCOPE, { name: 'Anna', normalizedName: 'anna' });
    const a2 = await store.graph.upsertEntity(SCOPE, { name: 'anna', normalizedName: 'anna' });
    const b = await store.graph.upsertEntity(SCOPE, { name: 'Bob', normalizedName: 'bob' });
    expect(a2).toBe(a1);
    expect(b).not.toBe(a1);
    const roots = await store.graph.listEntities(SCOPE);
    expect(roots.map((e) => e.normalizedName).sort()).toEqual(['anna', 'bob']);
  });

  it('stores + reads back the name embedding BLOB', async () => {
    const vec = new Float32Array([0.1, -0.2, 0.3, 0.4]);
    const id = await store.graph.upsertEntity(SCOPE, {
      name: 'Anna',
      normalizedName: 'anna',
      vector: vec,
    });
    const [entity] = await store.graph.listEntities(SCOPE);
    expect(entity?.id).toBe(id);
    expect(entity?.vector).not.toBeNull();
    expect(Array.from(entity?.vector ?? [])).toEqual([
      // Float32 round-trips with tolerable precision.
      expect.closeTo(0.1, 5),
      expect.closeTo(-0.2, 5),
      expect.closeTo(0.3, 5),
      expect.closeTo(0.4, 5),
    ]);
  });

  it('merges are auditable + reversible; distinct entities stay separate', async () => {
    const anna = await store.graph.upsertEntity(SCOPE, { name: 'Anna', normalizedName: 'anna' });
    const annie = await store.graph.upsertEntity(SCOPE, { name: 'Annie', normalizedName: 'annie' });
    const carol = await store.graph.upsertEntity(SCOPE, { name: 'Carol', normalizedName: 'carol' });

    await store.graph.mergeEntities(SCOPE, annie, anna, 'same person');
    expect(await store.graph.resolveCanonical(SCOPE, annie)).toBe(anna);
    expect((await store.graph.getEntity(SCOPE, annie))?.mergedInto).toBe(anna);
    // The unrelated entity is untouched.
    expect(await store.graph.resolveCanonical(SCOPE, carol)).toBe(carol);
    // Only the surviving root + carol remain roots.
    expect((await store.graph.listEntities(SCOPE)).map((e) => e.id).sort()).toEqual(
      [anna, carol].sort(),
    );

    await store.graph.unmergeEntity(SCOPE, annie, 'mistaken merge');
    expect(await store.graph.resolveCanonical(SCOPE, annie)).toBe(annie);
    expect((await store.graph.getEntity(SCOPE, annie))?.mergedInto).toBeUndefined();

    const ledger = await store.graph.listMerges(SCOPE);
    expect(ledger.map((m) => m.kind)).toEqual(['unmerge', 'merge']); // newest first
    expect(ledger[1]).toMatchObject({ kind: 'merge', fromEntityId: annie, intoEntityId: anna });
    expect(ledger[0]).toMatchObject({ kind: 'unmerge', fromEntityId: annie, intoEntityId: null });
  });
});

describe('P2-1 one-hop expansion (recursive CTE)', () => {
  let store: SqliteMemoryStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  // Two facts that share the entity "Anna": f1 mentions her as an object,
  // f2 as a subject. A lexical/vector search for f1 never surfaces f2 —
  // the graph hop does.
  async function chain(): Promise<{ f1: string; f2: string; anna: string }> {
    await store.semantic.remember(
      mkFact({ id: 'g_f1', text: 'Met Anna while travelling in Tbilisi', object: 'Anna' }),
    );
    await store.semantic.remember(
      mkFact({ id: 'g_f2', text: 'Anna recommended a sushi place', subject: 'Anna' }),
    );
    const anna = await store.graph.upsertEntity(SCOPE, { name: 'Anna', normalizedName: 'anna' });
    await store.graph.linkFactEntity('g_f1', anna, 'object');
    await store.graph.linkFactEntity('g_f2', anna, 'subject');
    return { f1: 'g_f1', f2: 'g_f2', anna };
  }

  it('returns the neighbour sharing an entity, excluding the seed', async () => {
    const { f1 } = await chain();
    const hop = await store.graph.expandOneHop(SCOPE, [f1]);
    expect(hop.map((f) => f.id)).toEqual(['g_f2']);
  });

  it('is empty for empty seeds and for a fact with no shared entity', async () => {
    await chain();
    await store.semantic.remember(mkFact({ id: 'g_iso', text: 'unrelated isolated fact' }));
    expect(await store.graph.expandOneHop(SCOPE, [])).toEqual([]);
    expect(await store.graph.expandOneHop(SCOPE, ['g_iso'])).toEqual([]);
  });

  it('canonicalises the traversal through a merge', async () => {
    await store.semantic.remember(
      mkFact({ id: 'm_f1', text: 'Met Anna in Tbilisi', object: 'Anna' }),
    );
    await store.semantic.remember(
      mkFact({ id: 'm_f2', text: 'Annie recommended sushi', subject: 'Annie' }),
    );
    const anna = await store.graph.upsertEntity(SCOPE, { name: 'Anna', normalizedName: 'anna' });
    const annie = await store.graph.upsertEntity(SCOPE, { name: 'Annie', normalizedName: 'annie' });
    await store.graph.linkFactEntity('m_f1', anna, 'object');
    await store.graph.linkFactEntity('m_f2', annie, 'subject');

    // Distinct entities ⇒ no hop.
    expect(await store.graph.expandOneHop(SCOPE, ['m_f1'])).toEqual([]);
    // Merge "Annie" into "Anna" ⇒ the hop now connects through the root.
    await store.graph.mergeEntities(SCOPE, annie, anna);
    expect((await store.graph.expandOneHop(SCOPE, ['m_f1'])).map((f) => f.id)).toEqual(['m_f2']);
    // Reversal disconnects them again.
    await store.graph.unmergeEntity(SCOPE, annie);
    expect(await store.graph.expandOneHop(SCOPE, ['m_f1'])).toEqual([]);
  });

  it('excludes quarantined neighbours unless includeQuarantined', async () => {
    await store.semantic.remember(
      mkFact({ id: 'q_f1', text: 'seed mentions Dana', object: 'Dana' }),
    );
    await store.semantic.remember(
      mkFact({ id: 'q_f2', text: 'Dana said something', subject: 'Dana', status: 'quarantined' }),
    );
    const dana = await store.graph.upsertEntity(SCOPE, { name: 'Dana', normalizedName: 'dana' });
    await store.graph.linkFactEntity('q_f1', dana, 'object');
    await store.graph.linkFactEntity('q_f2', dana, 'subject');

    expect(await store.graph.expandOneHop(SCOPE, ['q_f1'])).toEqual([]);
    expect(
      (await store.graph.expandOneHop(SCOPE, ['q_f1'], { includeQuarantined: true })).map(
        (f) => f.id,
      ),
    ).toEqual(['q_f2']);
  });
});
