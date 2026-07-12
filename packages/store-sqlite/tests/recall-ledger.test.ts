/**
 * Wave-D D4 - migration 036 recall ledger: distinct-query counting via
 * markAccessed(queryHash), the listPromotionCandidates feed, and
 * erasure (fact purge + session cascade) of ledger rows.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Fact, SessionScope } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const SCOPE = { userId: 'alex', sessionId: 's-1' } as const;

/** Structural view of the wave-D ext surface (pattern: d3-owner test). */
function semanticExt(store: GraphorinSqliteStore): {
  remember(fact: Fact): Promise<void>;
  markAccessed(
    ids: ReadonlyArray<string>,
    accessedAt?: number,
    scope?: SessionScope,
    queryHash?: string,
  ): Promise<void>;
  listPromotionCandidates(
    scope: SessionScope,
    options?: { readonly limit?: number },
  ): Promise<
    ReadonlyArray<{ fact: Fact; accessCount: number; uniqueQueryCount: number }>
  >;
  purge(id: string, reason?: string, scope?: SessionScope): Promise<void>;
} {
  return store.memory.semantic as unknown as ReturnType<typeof semanticExt>;
}

async function makeStore() {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-recall-ledger-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

async function seedFact(
  store: Awaited<ReturnType<typeof makeStore>>,
  id: string,
  status: 'active' | 'quarantined',
  sessionId?: string,
) {
  await semanticExt(store).remember({
    id,
    kind: 'semantic',
    userId: 'alex',
    ...(sessionId !== undefined ? { sessionId } : {}),
    sensitivity: 'internal',
    text: `fact ${id} about coffee`,
    status,
    provenance: 'extraction',
    createdAt: new Date().toISOString(),
  } as Fact);
}

describe('recall ledger (migration 036)', () => {
  it('markAccessed(queryHash) counts DISTINCT queries; replays are no-ops', async () => {
    const store = await makeStore();
    await seedFact(store, 'f-1', 'quarantined');
    const semantic = semanticExt(store);
    await semantic.markAccessed(['f-1'], undefined, SCOPE, 'hash-a');
    await semantic.markAccessed(['f-1'], undefined, SCOPE, 'hash-a'); // replay
    await semantic.markAccessed(['f-1'], undefined, SCOPE, 'hash-b');
    await semantic.markAccessed(['f-1'], undefined, SCOPE); // no hash: counter only

    const candidates = await semantic.listPromotionCandidates(SCOPE);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.fact.id).toBe('f-1');
    expect(candidates[0]?.accessCount).toBe(4);
    expect(candidates[0]?.uniqueQueryCount).toBe(2);
  });

  it('scope-guarded: a foreign scope neither bumps nor writes ledger rows', async () => {
    const store = await makeStore();
    await seedFact(store, 'f-2', 'quarantined');
    await semanticExt(store).markAccessed(['f-2'], undefined, { userId: 'mallory' }, 'h-x');
    const count = store.connection.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM fact_recall_queries WHERE fact_id = 'f-2'",
    );
    expect(count?.n).toBe(0);
  });

  it('listPromotionCandidates feeds only live quarantined facts', async () => {
    const store = await makeStore();
    await seedFact(store, 'f-active', 'active');
    await seedFact(store, 'f-quar', 'quarantined');
    const candidates = await semanticExt(store).listPromotionCandidates(SCOPE);
    expect(candidates.map((c) => c.fact.id)).toEqual(['f-quar']);
  });

  it('fact purge and the session cascade both erase ledger rows', async () => {
    const store = await makeStore();
    await seedFact(store, 'f-user', 'quarantined');
    await seedFact(store, 'f-sess', 'quarantined', 's-peer');
    const semantic = semanticExt(store);
    await semantic.markAccessed(['f-user'], undefined, undefined, 'h-1');
    await semantic.markAccessed(['f-sess'], undefined, undefined, 'h-2');
    const rows = (sql: string) => store.connection.get<{ n: number }>(sql)?.n ?? -1;
    expect(rows('SELECT COUNT(*) AS n FROM fact_recall_queries')).toBe(2);

    await semantic.purge('f-user');
    expect(rows("SELECT COUNT(*) AS n FROM fact_recall_queries WHERE fact_id = 'f-user'")).toBe(0);

    await store.sessions.deleteSession('s-peer');
    expect(rows("SELECT COUNT(*) AS n FROM fact_recall_queries WHERE fact_id = 'f-sess'")).toBe(0);
  });
});
