/**
 * D5 store-level graph retrieval: PPR-lite graded expansion
 * (`expandActivation` returns min hop depth) and the exact
 * entity-match retriever (`factsForEntityName`).
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
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-d5-graph-'));
  const conn = await openConnection({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  runMigrations(conn);
  const store = new SqliteMemoryStore(conn, new EmbeddingMetaRepository(conn, 'multi-active'));
  await store.init();
  return store;
}

let counter = 0;
function mkFact(over: Partial<Fact> = {}): Fact {
  counter += 1;
  return {
    id: `fact_${counter}`,
    kind: 'semantic',
    userId: SCOPE.userId,
    sessionId: SCOPE.sessionId,
    sensitivity: 'internal',
    text: 'a durable fact',
    createdAt: new Date().toISOString(),
    ...over,
  } as Fact;
}

let store: SqliteMemoryStore;
beforeEach(async () => {
  store = await makeStore();
});

describe('D5 — PPR-lite graded expansion (expandActivation)', () => {
  it('returns each neighbour with its minimum hop depth', async () => {
    // Chain: f1 --Anna-- f2 --Bob-- f3. Seed f1 → f2 at depth 1, f3 at depth 2.
    await store.semantic.remember(mkFact({ id: 'p1', object: 'Anna' }));
    await store.semantic.remember(mkFact({ id: 'p2', subject: 'Anna', object: 'Bob' }));
    await store.semantic.remember(mkFact({ id: 'p3', subject: 'Bob' }));
    const anna = await store.graph.upsertEntity(SCOPE, { name: 'Anna', normalizedName: 'anna' });
    const bob = await store.graph.upsertEntity(SCOPE, { name: 'Bob', normalizedName: 'bob' });
    await store.graph.linkFactEntity('p1', anna, 'object');
    await store.graph.linkFactEntity('p2', anna, 'subject');
    await store.graph.linkFactEntity('p2', bob, 'object');
    await store.graph.linkFactEntity('p3', bob, 'subject');

    const graded = await store.graph.expandActivation(SCOPE, ['p1'], { maxHops: 2 });
    const byId = new Map(graded.map((g) => [g.fact.id, g.depth]));
    expect(byId.get('p2')).toBe(1);
    expect(byId.get('p3')).toBe(2);
    // Seed itself is excluded.
    expect(byId.has('p1')).toBe(false);
    // maxHops: 1 stops at the direct neighbour.
    const oneHop = await store.graph.expandActivation(SCOPE, ['p1'], { maxHops: 1 });
    expect(oneHop.map((g) => g.fact.id)).toEqual(['p2']);
  });
});

describe('D5 — exact entity-match retriever (factsForEntityName)', () => {
  it('returns facts linked to the canonical entity, honouring merges', async () => {
    await store.semantic.remember(
      mkFact({ id: 'e1', text: 'Met Anna in Tbilisi', object: 'Anna' }),
    );
    await store.semantic.remember(
      mkFact({ id: 'e2', text: 'Annie recommended sushi', subject: 'Annie' }),
    );
    await store.semantic.remember(mkFact({ id: 'e3', text: 'unrelated coffee note' }));
    const anna = await store.graph.upsertEntity(SCOPE, { name: 'Anna', normalizedName: 'anna' });
    const annie = await store.graph.upsertEntity(SCOPE, { name: 'Annie', normalizedName: 'annie' });
    await store.graph.linkFactEntity('e1', anna, 'object');
    await store.graph.linkFactEntity('e2', annie, 'subject');

    // Before the merge, 'anna' returns only e1.
    expect((await store.graph.factsForEntityName(SCOPE, 'anna')).map((f) => f.id).sort()).toEqual([
      'e1',
    ]);
    // Merge Annie → Anna: 'anna' now canonicalises to both facts.
    await store.graph.mergeEntities(SCOPE, annie, anna, 'same person');
    expect((await store.graph.factsForEntityName(SCOPE, 'anna')).map((f) => f.id).sort()).toEqual([
      'e1',
      'e2',
    ]);
    // A name with no entity returns nothing.
    expect(await store.graph.factsForEntityName(SCOPE, 'nobody')).toEqual([]);
  });

  it('excludes quarantined facts unless opted in', async () => {
    await store.semantic.remember(
      mkFact({ id: 'q1', object: 'Zed', provenance: 'extraction', status: 'quarantined' }),
    );
    const zed = await store.graph.upsertEntity(SCOPE, { name: 'Zed', normalizedName: 'zed' });
    await store.graph.linkFactEntity('q1', zed, 'object');
    expect(await store.graph.factsForEntityName(SCOPE, 'zed')).toEqual([]);
    expect(
      (await store.graph.factsForEntityName(SCOPE, 'zed', { includeQuarantined: true })).map(
        (f) => f.id,
      ),
    ).toEqual(['q1']);
  });
});
