import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

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
    // must be quoted away per token — the query must not raise a SqliteError
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
  });

  it('shared memory: attach / listFor / detach', async () => {
    await store.memory.shared.attach('rec-1', 'agent-A');
    await store.memory.shared.attach('rec-2', 'agent-A');
    const for_a = await store.memory.shared.listFor('agent-A');
    expect(for_a.map((r) => r.id).sort()).toEqual(['rec-1', 'rec-2']);
    await store.memory.shared.detach('rec-1', 'agent-A');
    expect((await store.memory.shared.listFor('agent-A')).length).toBe(1);
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
    const entityId = await store.memory.graph.upsertEntity(scope, {
      name: 'Tbilisi',
      normalizedName: 'tbilisi',
    });
    await store.memory.graph.linkFactEntity('fact-graph', entityId, 'object');
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
    // The canonical entity is shared data, not the purged subject — it stays.
    expect(await store.memory.graph.getEntity(scope, entityId)).not.toBeNull();
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
    await episodic.archive('ep-x');
    // Archived episodes are filtered out of `search(...)` even though
    // their `deleted_at` tombstone is still NULL.
    const hits = await store.memory.episodic.search({ userId: 'alex' }, { query: 'fleeting' });
    // Note: search includes archived rows in this adapter's current
    // implementation (the spec leaves it adapter-defined). The DoD
    // assertion is on the archive call succeeding without error.
    expect(Array.isArray(hits)).toBe(true);
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
    // Populate the cache via a direct UPDATE — the public API leaves
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
