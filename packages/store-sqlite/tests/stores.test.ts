import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSqliteStore,
  type GraphorinSqliteStore,
  type SqliteMemoryStore,
} from '../src/index.js';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-stores-'));
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    skipSqliteVec: true,
  });
  await store.init();
  return store;
}

describe('createSqliteStore', () => {
  let store: GraphorinSqliteStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('init() applies migrations and is idempotent', async () => {
    expect(store.appliedMigrations.length).toBeGreaterThanOrEqual(10);
    await store.init();
    expect(store.appliedMigrations.length).toBeGreaterThanOrEqual(10);
  });

  it('working memory: upsert + list + delete', async () => {
    const created = new Date().toISOString();
    await store.memory.working.upsert(
      { userId: 'alex', sessionId: 's1' },
      {
        id: 'b1',
        kind: 'working',
        userId: 'alex',
        sessionId: 's1',
        sensitivity: 'internal',
        label: 'persona',
        value: 'Alex is a friendly user.',
        charLimit: 500,
        createdAt: created,
      },
    );
    const list = await store.memory.working.list({ userId: 'alex', sessionId: 's1' });
    expect(list.length).toBe(1);
    expect(list[0]?.label).toBe('persona');
    await store.memory.working.delete({ userId: 'alex', sessionId: 's1' }, 'persona');
    const after = await store.memory.working.list({ userId: 'alex', sessionId: 's1' });
    expect(after.length).toBe(0);
  });

  it('semantic memory: remember + search via FTS5', async () => {
    const fact = {
      id: 'f1',
      kind: 'semantic' as const,
      userId: 'alex',
      sensitivity: 'internal' as const,
      text: 'Loves mountain hiking and fresh espresso.',
      createdAt: new Date().toISOString(),
    };
    await store.memory.semantic.remember(fact);
    const hits = await store.memory.semantic.search({ userId: 'alex' }, { query: 'hiking' });
    expect(hits.length).toBe(1);
    expect(hits[0]?.record.id).toBe('f1');
    expect(hits[0]?.signals?.bm25).toBeTypeOf('number');
  });

  it('semantic memory: multi-word natural-language query matches non-adjacent terms (MRET-1/CS-6)', async () => {
    await store.memory.semantic.remember({
      id: 'f-anna',
      kind: 'semantic' as const,
      userId: 'alex',
      sensitivity: 'internal' as const,
      text: 'Anna works at Acme Corporation.',
      createdAt: new Date().toISOString(),
    });
    // A natural-language question whose terms are reordered and non-adjacent
    // relative to the stored fact. Whole-query phrase escaping returns zero
    // lexical hits here; tokenised escaping recalls on the shared term.
    const hits = await store.memory.semantic.search(
      { userId: 'alex' },
      { query: 'where does Anna work' },
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.record.id).toBe('f-anna');
    expect(hits[0]?.signals?.bm25).toBeTypeOf('number');
  });

  it('semantic memory: FTS5 operator characters in a query are neutralised, not interpreted (MRET-1/CS-6)', async () => {
    await store.memory.semantic.remember({
      id: 'f-special',
      kind: 'semantic' as const,
      userId: 'alex',
      sensitivity: 'internal' as const,
      text: 'Loves mountain hiking and fresh espresso.',
      createdAt: new Date().toISOString(),
    });
    // FTS5 syntax characters (`*`, `(`, `)`, `"`, boolean keywords, `NEAR/`)
    // must be quoted away per token - the query must not raise a SqliteError
    // and must still recall on the legitimate tokens it contains.
    const hits = await store.memory.semantic.search(
      { userId: 'alex' },
      { query: 'espresso* AND "fresh" OR (mountain) NEAR/2 hiking' },
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.record.id).toBe('f-special');
  });

  it('episodic memory: put + get + search', async () => {
    const ep = {
      id: 'e1',
      kind: 'episodic' as const,
      userId: 'alex',
      summary: 'Discussed lasagna recipes for two hours.',
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(7200_000).toISOString(),
      sensitivity: 'internal' as const,
      createdAt: new Date().toISOString(),
    };
    await store.memory.episodic.put(ep);
    const got = await store.memory.episodic.get('e1');
    expect(got?.summary).toMatch(/lasagna/);
    const hits = await store.memory.episodic.search({ userId: 'alex' }, { query: 'lasagna' });
    expect(hits.length).toBe(1);
  });

  it('procedural memory: add + list + remove', async () => {
    const rule = {
      id: 'r1',
      kind: 'procedural' as const,
      userId: 'alex',
      text: 'Always reply in Russian when the user writes in Russian.',
      priority: 80,
      sensitivity: 'public' as const,
      createdAt: new Date().toISOString(),
    };
    await store.memory.procedural.add(rule);
    const all = await store.memory.procedural.list({ userId: 'alex' });
    expect(all.length).toBe(1);
    expect(all[0]?.priority).toBe(80);
    // Author-defined rules carry no induced-procedure payload (migration 017).
    expect(all[0]?.steps).toBeUndefined();
    expect(all[0]?.provenance).toBeUndefined();
    expect(all[0]?.status).toBeUndefined();
    await store.memory.procedural.remove('r1');
    const after = await store.memory.procedural.list({ userId: 'alex' });
    expect(after.length).toBe(0);
  });

  it('procedural memory: induced-procedure fields round-trip (P2-2, migration 017)', async () => {
    const induced = {
      id: 'r-induced',
      kind: 'procedural' as const,
      userId: 'alex',
      text: 'Reorder pet food\n1. search for {product}\n2. add {quantity}\n3. check out',
      priority: 40,
      sensitivity: 'internal' as const,
      steps: Object.freeze(['search for {product}', 'add {quantity}', 'check out']),
      variables: Object.freeze(['product', 'quantity']),
      successCriteria: Object.freeze(['order confirmation shown']),
      provenance: 'induction' as const,
      status: 'quarantined' as const,
      createdAt: new Date().toISOString(),
    };
    await store.memory.procedural.add(induced);
    const all = await store.memory.procedural.list({ userId: 'alex' });
    const got = all.find((r) => r.id === 'r-induced');
    expect(got?.steps).toEqual(['search for {product}', 'add {quantity}', 'check out']);
    expect(got?.variables).toEqual(['product', 'quantity']);
    expect(got?.successCriteria).toEqual(['order confirmation shown']);
    expect(got?.provenance).toBe('induction');
    expect(got?.status).toBe('quarantined');
  });

  it('procedural memory: recordSuccess increments + round-trips the counter (MCON-2, migration 020)', async () => {
    const rule = {
      id: 'r-count',
      kind: 'procedural' as const,
      userId: 'alex',
      text: 'Induced procedure under trial',
      priority: 40,
      sensitivity: 'internal' as const,
      provenance: 'induction' as const,
      status: 'quarantined' as const,
      createdAt: new Date().toISOString(),
    };
    await store.memory.procedural.add(rule);
    const procedural = store.memory.procedural as unknown as {
      recordSuccess(id: string): Promise<number>;
    };
    expect(await procedural.recordSuccess('r-count')).toBe(1);
    expect(await procedural.recordSuccess('r-count')).toBe(2);
    const got = (await store.memory.procedural.list({ userId: 'alex' })).find(
      (r) => r.id === 'r-count',
    );
    expect(got?.successCount).toBe(2);
  });

  it('session memory: push + list + search', async () => {
    const scope = { userId: 'alex', sessionId: 's1' };
    const r1 = await store.memory.session.push(scope, {
      role: 'user',
      content: 'Tell me about Linux containers please.',
    });
    expect(r1.sequence).toBe(1);
    const r2 = await store.memory.session.push(scope, {
      role: 'assistant',
      content: 'Containers package an app and its dependencies.',
      agentId: 'main',
    });
    expect(r2.sequence).toBe(2);
    const list = await store.memory.session.list(scope);
    expect(list.length).toBe(2);
    expect(list[0]?.role).toBe('user');
    expect(list[1]?.role).toBe('assistant');
    const hits = await store.memory.session.search(scope, 'containers');
    expect(hits.length).toBeGreaterThanOrEqual(1);

    // RP-5: listWithMetadata surfaces the stored id / sequence / createdAt.
    const withMeta = await store.memory.session.listWithMetadata?.(scope);
    expect(withMeta).toBeDefined();
    expect(withMeta?.map((m) => m.messageId)).toEqual([r1.messageId, r2.messageId]);
    expect(withMeta?.map((m) => m.sequence)).toEqual([1, 2]);
    expect(withMeta?.[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(withMeta?.[0]?.message.role).toBe('user');
  });

  it('SESSIONS-01: session reads are scoped by userId (no cross-user read with a known sessionId)', async () => {
    const alice = { userId: 'alice', sessionId: 'sess-shared' };
    await store.memory.session.push(alice, {
      role: 'user',
      content: 'alice private note about her bank change',
    });
    // Same sessionId, different user: must see nothing.
    const mallory = { userId: 'mallory', sessionId: 'sess-shared' };
    expect((await store.memory.session.list(mallory)).length).toBe(0);
    expect((await store.memory.session.search(mallory, 'bank')).length).toBe(0);
    expect((await store.memory.session.listWithMetadata?.(mallory))?.length ?? 0).toBe(0);
    // The owner still reads her own transcript.
    expect((await store.memory.session.list(alice)).length).toBe(1);
  });

  it('shared memory: attach / listFor / detach', async () => {
    await store.memory.shared.attach('rec-1', 'agent-A');
    await store.memory.shared.attach('rec-2', 'agent-A');
    const for_a = await store.memory.shared.listFor('agent-A');
    expect(for_a.map((r) => r.id).sort()).toEqual(['rec-1', 'rec-2']);
    await store.memory.shared.detach('rec-1', 'agent-A');
    expect((await store.memory.shared.listFor('agent-A')).length).toBe(1);
  });

  it('semantic memory: listForDecay excludes archived rows by default; markAccessed bumps recency + strength (MCON-6/MRET-7)', async () => {
    const scope = { userId: 'alex' };
    const semantic = store.memory.semantic as unknown as {
      remember(f: Record<string, unknown>): Promise<void>;
      archiveFact(id: string, reason?: string): Promise<void>;
      markAccessed(ids: ReadonlyArray<string>, accessedAt?: number): Promise<void>;
      listForDecay(
        scope: { userId: string },
        limit?: number,
        opts?: { includeArchived?: boolean },
      ): Promise<
        ReadonlyArray<{
          id: string;
          archived: boolean;
          lastAccessedAt: number | null;
          strength: number;
        }>
      >;
    };
    const mk = (id: string) => ({
      id,
      kind: 'semantic' as const,
      userId: 'alex',
      sensitivity: 'internal' as const,
      text: `decay fixture ${id}`,
      createdAt: new Date().toISOString(),
    });
    await semantic.remember(mk('d-live'));
    await semantic.remember(mk('d-old'));
    await semantic.archiveFact('d-old', 'low_salience');

    // MCON-6: the decay window must not be saturated by archived rows.
    const window = await semantic.listForDecay(scope, 10);
    expect(window.map((r) => r.id)).toEqual(['d-live']);
    // The inspection path still reaches archived rows on request.
    const all = await semantic.listForDecay(scope, 10, { includeArchived: true });
    expect(all.map((r) => r.id).sort()).toEqual(['d-live', 'd-old']);

    // MRET-7: recall marks access - recency set, strength bumped with a cap.
    const accessedAt = Date.now();
    await semantic.markAccessed(['d-live'], accessedAt);
    const after = (await semantic.listForDecay(scope, 10)).find((r) => r.id === 'd-live');
    expect(after?.lastAccessedAt).toBe(accessedAt);
    expect(after?.strength).toBeGreaterThan(1);
    for (let i = 0; i < 30; i += 1) await semantic.markAccessed(['d-live'], accessedAt + i);
    const capped = (await semantic.listForDecay(scope, 10)).find((r) => r.id === 'd-live');
    expect(capped?.strength).toBeLessThanOrEqual(2);
  });

  it('semantic memory: get + purge extension methods (consumed by @graphorin/memory)', async () => {
    const fact = {
      id: 'fact-x',
      kind: 'semantic' as const,
      userId: 'alex',
      sensitivity: 'internal' as const,
      text: 'a private detail to purge',
      createdAt: new Date().toISOString(),
    };
    const semantic = store.memory.semantic as unknown as {
      get(id: string): Promise<typeof fact | null>;
      purge(id: string, reason?: string): Promise<void>;
      remember(f: typeof fact): Promise<void>;
    };
    await semantic.remember(fact);
    const fetched = await semantic.get('fact-x');
    expect(fetched?.text).toBe('a private detail to purge');
    await semantic.purge('fact-x', 'gdpr-request');
    expect(await semantic.get('fact-x')).toBeNull();
  });

  it('purge() scrubs fact text out of memory_history; pruneHistory retires old rows (store-04)', async () => {
    const now = new Date().toISOString();
    const semantic = store.memory.semantic as unknown as {
      remember(f: import('@graphorin/core').Fact): Promise<void>;
      supersede(
        oldId: string,
        next: import('@graphorin/core').Fact,
        reason?: string,
      ): Promise<void>;
      purge(id: string, reason?: string): Promise<void>;
    };
    const oldFact: import('@graphorin/core').Fact = {
      id: 'hist-old',
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'SECRET-OLD lives in Berlin',
      createdAt: now,
    };
    const newFact: import('@graphorin/core').Fact = {
      id: 'hist-new',
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'SECRET-NEW lives in Paris',
      createdAt: now,
    };
    await semantic.remember(oldFact);
    await semantic.supersede('hist-old', newFact, 'moved');
    // The SUPERSEDE audit row carries the NEW fact's text.
    const preScrub = store.connection.all<{ new_value: string | null }>(
      "SELECT new_value FROM memory_history WHERE memory_kind = 'fact' AND event = 'SUPERSEDE'",
    );
    expect(preScrub.some((r) => r.new_value === 'SECRET-NEW lives in Paris')).toBe(true);

    // GDPR purge of the NEW fact: its text must vanish from the audit
    // trail too - including the SUPERSEDE row keyed to the OLD id.
    await semantic.purge('hist-new', 'gdpr-request');
    const postScrub = store.connection.all<{ prev_value: string | null; new_value: string | null }>(
      "SELECT prev_value, new_value FROM memory_history WHERE memory_kind = 'fact'",
    );
    const dump = JSON.stringify(postScrub);
    expect(dump).not.toContain('SECRET-NEW');
    // The event skeleton survives (rows are scrubbed, not deleted).
    const events = store.connection.all<{ event: string }>(
      "SELECT event FROM memory_history WHERE memory_kind = 'fact'",
    );
    expect(events.some((r) => r.event === 'SUPERSEDE')).toBe(true);
    expect(events.some((r) => r.event === 'PURGE')).toBe(true);

    // Retention prune: rows older than the cutoff are deleted. The
    // facade types `memory` as MemoryStoreExt (W-066) - no cast needed;
    // the runtime probe guards against the untyped drift expectTypeOf
    // cannot (tests/ are not tsc-gated).
    expect(typeof store.memory.pruneHistory).toBe('function');
    const pruned = await store.memory.pruneHistory(0);
    expect(pruned).toBeGreaterThan(0);
    const left = store.connection.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM memory_history WHERE memory_kind = 'fact'",
    );
    expect(left?.n).toBe(0);
  });

  it('semantic memory: purge() of a graph-linked fact removes the fact + its entity links, keeps the entity (CS-1)', async () => {
    const scope = { userId: 'alex', sessionId: 's1' };
    const fact = {
      id: 'fact-graph',
      kind: 'semantic' as const,
      userId: 'alex',
      sensitivity: 'internal' as const,
      text: 'Alex lives in Tbilisi',
      subject: 'Alex',
      predicate: 'lives_in',
      object: 'Tbilisi',
      createdAt: new Date().toISOString(),
    };
    const semantic = store.memory.semantic as unknown as {
      get(id: string): Promise<typeof fact | null>;
      purge(id: string, reason?: string): Promise<void>;
      remember(f: typeof fact): Promise<void>;
    };
    await semantic.remember(fact);
    // Link the fact to a canonical entity, exactly as on-write resolution does
    // when graph.entityResolution is enabled. This is what makes purge() trip
    // the fact_entities → facts(id) foreign key with no ON DELETE clause.
    const graph = (store.memory as SqliteMemoryStore).graph;
    const entityId = await graph.upsertEntity(scope, {
      name: 'Tbilisi',
      normalizedName: 'tbilisi',
    });
    await graph.linkFactEntity('fact-graph', entityId, 'object');
    expect(
      store.connection.all('SELECT 1 FROM fact_entities WHERE fact_id = ?', ['fact-graph']).length,
    ).toBe(1);

    // Pre-fix: DELETE FROM facts throws FOREIGN KEY constraint failed and the
    // whole purge transaction (incl. the PURGE audit row) rolls back.
    await semantic.purge('fact-graph', 'gdpr-request');

    expect(await semantic.get('fact-graph')).toBeNull();
    expect(
      store.connection.all('SELECT 1 FROM fact_entities WHERE fact_id = ?', ['fact-graph']).length,
    ).toBe(0);
    // The canonical entity is shared data, not the purged subject - it stays.
    expect(await graph.getEntity(scope, entityId)).not.toBeNull();
  });

  it('episodic memory: archive extension method', async () => {
    const ep = {
      id: 'ep-x',
      kind: 'episodic' as const,
      userId: 'alex',
      summary: 'a fleeting episode',
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(60_000).toISOString(),
      sensitivity: 'internal' as const,
      createdAt: new Date().toISOString(),
    };
    const episodic = store.memory.episodic as unknown as {
      put(e: typeof ep): Promise<void>;
      archive(id: string, reason?: string): Promise<void>;
    };
    await episodic.put(ep);
    // Before archiving the episode IS searchable via FTS.
    const before = await store.memory.episodic.search({ userId: 'alex' }, { query: 'fleeting' });
    expect(before.some((h) => h.record.id === 'ep-x')).toBe(true);
    await episodic.archive('ep-x');
    // CS-2: archive() excludes the episode from BOTH the FTS and vector
    // legs (the TSDoc promise; the FTS leg used to leak archived rows).
    const hits = await store.memory.episodic.search({ userId: 'alex' }, { query: 'fleeting' });
    expect(hits.some((h) => h.record.id === 'ep-x')).toBe(false);
  });

  it('mutators are scope-guarded: a foreign scope is a deterministic no-op (W-154)', async () => {
    const mkFact = (id: string, userId: string) => ({
      id,
      kind: 'semantic' as const,
      userId,
      sensitivity: 'internal' as const,
      text: `owned by ${userId} (${id})`,
      createdAt: new Date().toISOString(),
    });
    await store.memory.semantic.remember(mkFact('vic-f1', 'victim'));
    await store.memory.semantic.remember(mkFact('vic-f2', 'victim'));
    const semantic = store.memory.semantic as unknown as {
      get(id: string): Promise<{ status?: string; archived?: boolean } | null>;
      forget(id: string, reason?: string, scope?: { userId: string }): Promise<void>;
      setStatus(
        id: string,
        status: string,
        reason?: string,
        scope?: { userId: string },
      ): Promise<void>;
      archiveFact(id: string, reason?: string, scope?: { userId: string }): Promise<void>;
      purge(id: string, reason?: string, scope?: { userId: string }): Promise<void>;
      markAccessed(
        ids: ReadonlyArray<string>,
        accessedAt?: number,
        scope?: { userId: string },
      ): Promise<void>;
    };
    const attacker = { userId: 'attacker' };
    const victim = { userId: 'victim' };

    // Foreign-scope mutations: all no-ops.
    await semantic.forget('vic-f1', 'evil', attacker);
    expect(await semantic.get('vic-f1')).not.toBeNull();
    await semantic.setStatus('vic-f1', 'quarantined', 'evil', attacker);
    expect((await semantic.get('vic-f1'))?.status ?? 'active').not.toBe('quarantined');
    await semantic.archiveFact('vic-f1', 'evil', attacker);
    const archivedRow = store.connection.get<{ archived: number }>(
      'SELECT archived FROM facts WHERE id = ?',
      ['vic-f1'],
    );
    expect(archivedRow?.archived).toBe(0);
    await semantic.purge('vic-f1', 'evil', attacker);
    expect(await semantic.get('vic-f1')).not.toBeNull();
    // A foreign purge writes NOTHING - not even the PURGE audit row.
    const purgeRows = store.connection.all(
      "SELECT 1 FROM memory_history WHERE memory_kind = 'fact' AND memory_id = ? AND event = 'PURGE'",
      ['vic-f1'],
    );
    expect(purgeRows.length).toBe(0);
    await semantic.markAccessed(['vic-f1'], undefined, attacker);
    const accessRow = store.connection.get<{ access_count: number }>(
      'SELECT access_count FROM facts WHERE id = ?',
      ['vic-f1'],
    );
    expect(accessRow?.access_count).toBe(0);

    // Correct scope: the same calls mutate.
    await semantic.markAccessed(['vic-f1'], undefined, victim);
    expect(
      store.connection.get<{ access_count: number }>(
        'SELECT access_count FROM facts WHERE id = ?',
        ['vic-f1'],
      )?.access_count,
    ).toBe(1);
    await semantic.setStatus('vic-f1', 'quarantined', 'ok', victim);
    expect(
      store.connection.get<{ status: string }>('SELECT status FROM facts WHERE id = ?', ['vic-f1'])
        ?.status,
    ).toBe('quarantined');
    await semantic.purge('vic-f1', 'gdpr', victim);
    expect(await semantic.get('vic-f1')).toBeNull();

    // No scope: historical unscoped behaviour (trusted internal callers).
    await semantic.forget('vic-f2');
    expect(await semantic.get('vic-f2')).toBeNull();

    // Episodes: archive + setStatus.
    const ep = {
      id: 'vic-e1',
      kind: 'episodic' as const,
      userId: 'victim',
      summary: 'victim episode',
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(1000).toISOString(),
      sensitivity: 'internal' as const,
      createdAt: new Date().toISOString(),
    };
    const episodic = store.memory.episodic as unknown as {
      put(e: typeof ep): Promise<void>;
      archive(id: string, reason?: string, scope?: { userId: string }): Promise<void>;
      setStatus(
        id: string,
        status: string,
        reason?: string,
        scope?: { userId: string },
      ): Promise<void>;
    };
    await episodic.put(ep);
    await episodic.archive('vic-e1', 'evil', attacker);
    expect(
      store.connection.get<{ archived: number }>('SELECT archived FROM episodes WHERE id = ?', [
        'vic-e1',
      ])?.archived,
    ).toBe(0);
    await episodic.setStatus('vic-e1', 'quarantined', 'evil', attacker);
    expect(
      store.connection.get<{ status: string }>('SELECT status FROM episodes WHERE id = ?', [
        'vic-e1',
      ])?.status,
    ).not.toBe('quarantined');
    await episodic.archive('vic-e1', 'ok', victim);
    expect(
      store.connection.get<{ archived: number }>('SELECT archived FROM episodes WHERE id = ?', [
        'vic-e1',
      ])?.archived,
    ).toBe(1);

    // Rules + insights setStatus.
    await store.memory.procedural.add({
      id: 'vic-r1',
      kind: 'procedural' as const,
      userId: 'victim',
      text: 'victim rule',
      priority: 10,
      sensitivity: 'internal' as const,
      status: 'quarantined' as const,
      createdAt: new Date().toISOString(),
    });
    const procedural = store.memory.procedural as unknown as {
      setStatus(
        id: string,
        status: string,
        reason?: string,
        scope?: { userId: string },
      ): Promise<void>;
    };
    await procedural.setStatus('vic-r1', 'active', 'evil', attacker);
    expect(
      store.connection.get<{ status: string }>('SELECT status FROM rules WHERE id = ?', ['vic-r1'])
        ?.status,
    ).toBe('quarantined');
    await procedural.setStatus('vic-r1', 'active', 'ok', victim);
    expect(
      store.connection.get<{ status: string }>('SELECT status FROM rules WHERE id = ?', ['vic-r1'])
        ?.status,
    ).toBe('active');
  });

  it('episodic memory: count() applies the archived filter of its contract (W-155)', async () => {
    const base = {
      kind: 'episodic' as const,
      userId: 'w155',
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(60_000).toISOString(),
      sensitivity: 'internal' as const,
      createdAt: new Date().toISOString(),
    };
    const episodic = store.memory.episodic as unknown as {
      put(e: Record<string, unknown>): Promise<void>;
      archive(id: string): Promise<void>;
      setStatus(id: string, status: string): Promise<void>;
      count(scope: { userId: string }): Promise<number>;
    };
    await episodic.put({ ...base, id: 'w155-a', summary: 'stays live' });
    await episodic.put({ ...base, id: 'w155-b', summary: 'gets archived' });
    await episodic.put({ ...base, id: 'w155-c', summary: 'gets quarantined' });
    expect(await episodic.count({ userId: 'w155' })).toBe(3);

    // Archived episodes leave the count (they left FTS/vector recall).
    await episodic.archive('w155-b');
    expect(await episodic.count({ userId: 'w155' })).toBe(2);

    // The quarantined filter does not regress.
    await episodic.setStatus('w155-c', 'quarantined');
    expect(await episodic.count({ userId: 'w155' })).toBe(1);
  });

  it('session memory: totalCachedTokens (DEC-131 cache surface)', async () => {
    const scope = { userId: 'alex', sessionId: 's1' };
    const r = await store.memory.session.push(scope, {
      role: 'user',
      content: 'cache me',
    });
    const sessionExt = store.memory.session as unknown as {
      totalCachedTokens(s: typeof scope): Promise<number | null>;
    };
    // Empty cache → null.
    expect(await sessionExt.totalCachedTokens(scope)).toBeNull();
    // Populate the cache via a direct UPDATE - the public API leaves
    // it null until the provider layer wires the token counter
    // through (Phase 11 / DEC-131).
    store.connection.run('UPDATE session_messages SET token_count = ? WHERE id = ?', [
      42,
      r.messageId,
    ]);
    expect(await sessionExt.totalCachedTokens(scope)).toBe(42);
  });

  it('checkpoint store: put + getTuple + list', async () => {
    const cp = {
      id: 'cp-1',
      threadId: 't1',
      namespace: 'ns',
      state: { foo: 'bar' },
      channelVersions: { state: 1 },
      stepNumber: 1,
      createdAt: new Date().toISOString(),
    };
    await store.checkpoints.put('t1', 'ns', cp, { source: 'sync', status: 'running' });
    const tuple = await store.checkpoints.getTuple('t1', 'ns', 'cp-1');
    expect(tuple?.checkpoint.id).toBe('cp-1');
    expect(tuple?.metadata.status).toBe('running');
    const list = [];
    for await (const t of store.checkpoints.list('t1', 'ns')) list.push(t);
    expect(list.length).toBe(1);
    await store.checkpoints.deleteThread('t1');
    expect(await store.checkpoints.getTuple('t1', 'ns', 'cp-1')).toBeNull();
  });

  it('session store: createSession + agents + handoffs', async () => {
    const created = new Date().toISOString();
    await store.sessions.createSession({
      id: 's1',
      userId: 'alex',
      agentId: 'main',
      createdAt: created,
    });
    expect((await store.sessions.getSession('s1'))?.agentId).toBe('main');
    await store.sessions.registerAgent({
      id: 'main',
      displayName: 'Main agent',
      registeredAt: created,
    });
    expect((await store.sessions.resolveAgent('main'))?.displayName).toBe('Main agent');
    await store.sessions.appendHandoff('s1', {
      fromAgentId: 'main',
      toAgentId: 'helper',
      stepNumber: 3,
      at: new Date().toISOString(),
      reason: 'specialist',
    });
    const handoffs = await store.sessions.listHandoffs('s1');
    expect(handoffs.length).toBe(1);
    expect(handoffs[0]?.toAgentId).toBe('helper');
  });

  it('session search: the positional query is authoritative over opts.query (W-127)', async () => {
    const scope = { userId: 'alex', sessionId: 's-prio' };
    const alphaRef = await store.memory.session.push(scope, {
      role: 'user',
      content: 'the alpha topic',
    });
    const betaRef = await store.memory.session.push(scope, {
      role: 'user',
      content: 'the beta topic',
    });
    const hits = await store.memory.session.search(scope, 'alpha', {
      query: 'beta',
      topK: 5,
    });
    expect(hits.length).toBe(1);
    expect(hits[0]?.record.id).toBe(alphaRef.messageId);
    expect(hits[0]?.record.id).not.toBe(betaRef.messageId);
  });

  it('trigger store: upsert + recordFire + list', async () => {
    const t = {
      id: 't-cron-1',
      kind: 'cron' as const,
      spec: '*/5 * * * *',
      callbackRef: 'tools.dailyDigest',
      missedFires: 0,
      disabled: false,
      catchupPolicy: 'last' as const,
      maxCatchupRuns: 1,
      catchupWindowMs: 24 * 60 * 60 * 1000,
      createdAt: new Date().toISOString(),
    };
    await store.triggers.upsert(t);
    expect((await store.triggers.get('t-cron-1'))?.kind).toBe('cron');
    const firedAt = new Date().toISOString();
    await store.triggers.recordFire('t-cron-1', firedAt, firedAt);
    expect((await store.triggers.list()).length).toBe(1);
    await store.triggers.remove('t-cron-1');
    expect((await store.triggers.list()).length).toBe(0);
  });

  it('trigger store: recordFire is fenced monotonically (W-133)', async () => {
    const t = {
      id: 't-fence-1',
      kind: 'interval' as const,
      spec: 'PT5M',
      callbackRef: 'tools.sync',
      missedFires: 0,
      disabled: false,
      catchupPolicy: 'last' as const,
      maxCatchupRuns: 1,
      catchupWindowMs: 24 * 60 * 60 * 1000,
      createdAt: new Date().toISOString(),
    };
    await store.triggers.upsert(t);

    // Fresh trigger (last_fired_at NULL): the first fire lands.
    const late = new Date('2026-07-06T12:10:00.000Z').toISOString();
    const lateNext = new Date('2026-07-06T12:15:00.000Z').toISOString();
    await store.triggers.recordFire('t-fence-1', late, lateNext);
    const afterLate = await store.triggers.get('t-fence-1');
    expect(afterLate?.lastFiredAt).toBe(late);
    expect(afterLate?.nextFireAt).toBe(lateNext);

    // A second (unsupported second-scheduler) fixation with an EARLIER
    // firedAt is a no-op: state keeps the later fire.
    const earlier = new Date('2026-07-06T12:05:00.000Z').toISOString();
    await store.triggers.recordFire(
      't-fence-1',
      earlier,
      new Date('2026-07-06T12:07:00.000Z').toISOString(),
    );
    const afterEarlier = await store.triggers.get('t-fence-1');
    expect(afterEarlier?.lastFiredAt).toBe(late);
    expect(afterEarlier?.nextFireAt).toBe(lateNext);

    // Same firedAt: also a no-op (strict fence).
    await store.triggers.recordFire(
      't-fence-1',
      late,
      new Date('2026-07-06T12:20:00.000Z').toISOString(),
    );
    expect((await store.triggers.get('t-fence-1'))?.nextFireAt).toBe(lateNext);

    // A strictly later fire still advances normally.
    const later = new Date('2026-07-06T12:15:00.000Z').toISOString();
    const laterNext = new Date('2026-07-06T12:20:00.000Z').toISOString();
    await store.triggers.recordFire('t-fence-1', later, laterNext);
    const afterLater = await store.triggers.get('t-fence-1');
    expect(afterLater?.lastFiredAt).toBe(later);
    expect(afterLater?.nextFireAt).toBe(laterNext);
    await store.triggers.remove('t-fence-1');
  });

  it('auth-token store: put / get / revoke / record', async () => {
    const created = new Date().toISOString();
    await store.authTokens.put({
      id: 'tk-1',
      hashHex: 'deadbeef',
      label: 'CI',
      scopes: ['agent:run', 'memory:read'],
      createdAt: created,
    });
    expect((await store.authTokens.get('tk-1'))?.label).toBe('CI');
    expect((await store.authTokens.list()).length).toBe(1);
    await store.authTokens.revoke('tk-1', new Date().toISOString());
    expect((await store.authTokens.get('tk-1'))?.revokedAt).toBeDefined();
    await store.authTokens.recordUse('tk-1', new Date().toISOString());
    expect((await store.authTokens.get('tk-1'))?.lastUsedAt).toBeDefined();
  });

  it('oauth-server store: put / get / update / delete', async () => {
    const now = Date.now();
    await store.oauthServers.put({
      id: 'svc',
      serverUrl: 'https://example.com',
      clientId: 'abc',
      createdAt: now,
      updatedAt: now,
    });
    const got = await store.oauthServers.get('svc');
    expect(got?.serverUrl).toBe('https://example.com');
    const updated = await store.oauthServers.update('svc', { issuer: 'iss-1' });
    expect(updated.issuer).toBe('iss-1');
    await store.oauthServers.delete('svc');
    expect(await store.oauthServers.get('svc')).toBeNull();
  });

  it('idempotency store: put + get + prune', async () => {
    const now = Date.now();
    await store.idempotency.put({
      key: 'k1',
      requestHash: 'h',
      statusCode: 201,
      response: { ok: true },
      createdAt: now,
      expiresAt: now + 1000,
    });
    expect((await store.idempotency.get('k1'))?.statusCode).toBe(201);
    const pruned = await store.idempotency.prune(now + 2000);
    expect(pruned).toBe(1);
    expect(await store.idempotency.get('k1')).toBeNull();
  });

  it('session memory: list filters by agentId, role, sinceMessageId, lastN', async () => {
    const scope = { userId: 'alex', sessionId: 's1' };
    const r1 = await store.memory.session.push(scope, {
      role: 'user',
      content: 'hi',
    });
    const r2 = await store.memory.session.push(scope, {
      role: 'assistant',
      content: 'hello, alex',
      agentId: 'main',
    });
    await store.memory.session.push(scope, {
      role: 'assistant',
      content: 'follow-up',
      agentId: 'helper',
    });
    await store.memory.session.push(scope, {
      role: 'tool',
      toolCallId: 'tc-1',
      content: 'output',
    });
    expect((await store.memory.session.list(scope, { agentId: 'main' })).length).toBe(1);
    expect((await store.memory.session.list(scope, { agentId: 'helper' })).length).toBe(1);
    expect((await store.memory.session.list(scope, { role: 'tool' })).length).toBe(1);
    expect((await store.memory.session.list(scope, { lastN: 2 })).length).toBe(2);
    expect((await store.memory.session.list(scope, { sinceMessageId: r1.messageId })).length).toBe(
      3,
    );
    expect((await store.memory.session.list(scope, { sinceMessageId: r2.messageId })).length).toBe(
      2,
    );
  });

  it('checkpoints: putWrites stores per-task pending writes for resume', async () => {
    const cp = {
      id: 'cp-task',
      threadId: 't-task',
      namespace: 'ns',
      state: { x: 1 },
      channelVersions: { x: 1 },
      stepNumber: 1,
      createdAt: new Date().toISOString(),
    };
    await store.checkpoints.put('t-task', 'ns', cp, { source: 'sync', status: 'running' });
    await store.checkpoints.putWrites(
      't-task',
      'ns',
      'cp-task',
      [
        { taskId: 'task-A', index: 0, channel: 'state', value: 1 },
        { taskId: 'task-A', index: 1, channel: 'logs', value: 'hello' },
      ],
      'task-A',
    );
    const tuple = await store.checkpoints.getTuple('t-task', 'ns', 'cp-task');
    expect(tuple?.pendingWrites?.length).toBe(2);
    expect(tuple?.pendingWrites?.[0]?.value).toBe(1);
    expect(tuple?.pendingWrites?.[1]?.value).toBe('hello');
  });

  it('embedder registry: lock-on-first rejects a second incompatible embedder', async () => {
    store.embeddings.registerOrReturn({
      id: 'transformersjs:multilingual-e5-base@768',
      embedderKind: 'transformersjs',
      model: 'multilingual-e5-base',
      dim: 768,
      configHash: 'a1b2',
    });
    expect(() =>
      store.embeddings.registerOrReturn({
        id: 'ollama:bge-m3@1024',
        embedderKind: 'ollama',
        model: 'bge-m3',
        dim: 1024,
        configHash: 'beef',
      }),
    ).toThrow(/lock-on-first/);
  });
});
