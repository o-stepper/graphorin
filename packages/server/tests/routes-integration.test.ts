import { createToken } from '@graphorin/security';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import type { AuditApi, McpApi, MemoryApi, SessionApi, SkillsApi } from '../src/routes/index.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_INT_PEPPER';
const PEPPER_VALUE = 'integration-pepper-with-enough-bytes-Q9pZ7nL';

function buildSessionStub(): SessionApi {
  const store = new Map<
    string,
    { id: string; userId: string; agentId: string; messages: unknown[]; handoffs: unknown[] }
  >();
  return {
    async list(opts) {
      return Array.from(store.values()).filter((s) => {
        if (opts.userId !== undefined && s.userId !== opts.userId) return false;
        if (opts.agentId !== undefined && s.agentId !== opts.agentId) return false;
        return true;
      });
    },
    async get(id) {
      return store.get(id) ?? null;
    },
    async create(input) {
      const id = input.sessionId ?? `sess-${store.size + 1}`;
      const meta = { id, userId: input.userId, agentId: input.agentId, messages: [], handoffs: [] };
      store.set(id, meta);
      return meta;
    },
    async remove(id) {
      return store.delete(id);
    },
    async listMessages(id) {
      return store.get(id)?.messages ?? [];
    },
    async listHandoffs(id) {
      return store.get(id)?.handoffs ?? [];
    },
    async exportSession(id, opts) {
      return { sessionId: id, includeAuditEntries: opts.includeAuditEntries === true };
    },
    async *replaySession(id, _opts) {
      yield { sessionId: id, kind: 'placeholder' };
    },
  };
}

function buildMemoryStub(): MemoryApi {
  const facts = new Map<string, unknown>();
  const blocks = new Map<string, unknown>();
  return {
    async search(input) {
      return [{ query: input.query, scope: input.scope }];
    },
    async remember(input) {
      const id = `fact-${facts.size + 1}`;
      facts.set(id, input);
      return { factId: id };
    },
    async forget(_scope, factId) {
      return facts.delete(factId);
    },
    async upsertBlock(input) {
      blocks.set(input.label, input);
      return { label: input.label };
    },
    async deleteBlock(_scope, label) {
      return blocks.delete(label);
    },
  };
}

function buildSkillsStub(): SkillsApi {
  const known = new Map<string, unknown>();
  return {
    async list() {
      return Array.from(known.entries()).map(([name]) => ({ name }));
    },
    async get(name) {
      return known.get(name) ?? null;
    },
    async install(input) {
      const name = input.source;
      known.set(name, { name, source: input.source });
      return { name };
    },
  };
}

function buildMcpStub(): McpApi {
  const servers = new Map<string, unknown>();
  return {
    async list() {
      return Array.from(servers.values());
    },
    async register(input) {
      servers.set(input.id, input);
      return input;
    },
    async remove(id) {
      return servers.delete(id);
    },
  };
}

function buildAuditStub(): AuditApi {
  return {
    async list(opts) {
      return [{ kind: 'placeholder', limit: opts.limit ?? null, fromSeq: opts.fromSeq ?? null }];
    },
    async export(_opts) {
      return { bytes: 0 };
    },
  };
}

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;
let bearer: string | undefined;
let adminBearer: string | undefined;

/** The booted server - every test runs after bootServer() in beforeEach. */
function srv(): GraphorinServer {
  if (server === undefined) throw new Error('server not booted');
  return server;
}

async function bootServer(extraScopes?: ReadonlyArray<string>): Promise<{
  server: GraphorinServer;
  bearer: string;
  adminBearer: string;
}> {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env[PEPPER_ENV] = PEPPER_VALUE;
  store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  server = await createServer({
    store,
    skipHardening: true,
    skipListen: true,
    sessions: buildSessionStub(),
    // IP-14: the REAL replay route (replay/routes.ts) must serve even
    // with the sessions API configured - the old in-sessions stub
    // shadowed it.
    replay: {
      async loadRunReplay(input: { runId: string; mode: string }) {
        return { events: [{ runId: input.runId, mode: input.mode }] };
      },
      async loadSessionReplay(input: { sessionId: string; mode: string }) {
        return { events: [{ sessionId: input.sessionId, mode: input.mode }] };
      },
    } as never,
    memory: buildMemoryStub(),
    skills: buildSkillsStub(),
    mcp: buildMcpStub(),
    audit: buildAuditStub(),
    config: {
      auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
      storage: { path: ':memory:', mode: 'lib' },
      server: {
        rateLimit: { enabled: false },
        csrf: { enabled: false },
      },
    },
  });
  await server.start();

  const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
  const standardScopes: ReadonlyArray<string> = [
    'agents:read',
    'agents:invoke',
    'workflows:read',
    'workflows:execute',
    'workflows:resume',
    'sessions:read',
    'sessions:write',
    'sessions:export',
    'sessions:replay',
    'traces:read:sanitized',
    'traces:read:raw',
    'memory:read',
    'memory:write',
    'skills:read',
    'skills:install',
    'mcp:admin',
    'audit:read',
    'audit:export',
    'tokens:create',
    'tokens:list',
    'tokens:revoke',
    ...(extraScopes ?? []),
  ];
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: standardScopes,
  });
  const minted2 = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ['admin:*'],
  });
  bearer = await minted.raw.use((v) => v);
  adminBearer = await minted2.raw.use((v) => v);
  return { server, bearer, adminBearer };
}

afterEach(async () => {
  if (server !== undefined) {
    await server.stop().catch(() => {});
    server = undefined;
  }
  if (store !== undefined) {
    await store.close().catch(() => {});
    store = undefined;
  }
  delete process.env[PEPPER_ENV];
  bearer = undefined;
  adminBearer = undefined;
});

describe('REST integration - happy + error paths', () => {
  beforeEach(async () => {
    await bootServer();
  });

  it('GET /v1/health is anonymous-reachable and returns the version', async () => {
    const res = await srv().app.request('/v1/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; version: string };
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.5.0');
  });

  it('GET /v1/agents returns the registry contents', async () => {
    srv().agents.register({
      id: 'echo',
      description: 'echo agent',
      agent: {
        id: 'echo',
        async run(i) {
          return i;
        },
      },
    });
    const res = await srv().app.request('/v1/agents', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { agents: ReadonlyArray<{ id: string }> };
    expect(body.agents.map((a) => a.id)).toEqual(['echo']);
  });

  it('POST /v1/agents/:id/run returns the agent result on success', async () => {
    srv().agents.register({
      id: 'echo',
      agent: {
        id: 'echo',
        async run(input) {
          return { echoed: input };
        },
      },
    });
    const res = await srv().app.request('/v1/agents/echo/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'hello world' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { runId: string; status: string; result: unknown };
    expect(body.status).toBe('completed');
    expect(body.runId).toBeDefined();
    expect(body.result).toEqual({ echoed: 'hello world' });
  });

  it('POST /v1/agents/:id/run returns 404 for an unknown agent', async () => {
    const res = await srv().app.request('/v1/agents/missing/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('route-handler-missing');
  });

  it('POST /v1/agents/:id/stream returns 202 + a runId envelope', async () => {
    srv().agents.register({
      id: 'echo',
      agent: {
        id: 'echo',
        async run(i) {
          return i;
        },
      },
    });
    const res = await srv().app.request('/v1/agents/echo/stream', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'hi' }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      runId: string;
      status: string;
      subscribe: { websocket: string; sse?: string };
    };
    // IP-2: the run actually starts now ('running', not a forever-
    // 'pending' declaration) and the 202 no longer advertises the
    // never-mounted SSE URL.
    expect(body.status).toBe('running');
    expect(body.subscribe.websocket).toContain('agent:echo/runs/');
    expect(body.subscribe.sse).toBeUndefined();
    // The background run completes (run-only registry entry).
    await new Promise((r) => setTimeout(r, 20));
    const snap = srv().runs.snapshot(body.runId);
    expect(snap?.status).toBe('completed');
  });

  it('GET /v1/runs/:runId/state returns a terminal snapshot for a completed run', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.agents.register({
      id: 'echo',
      agent: {
        id: 'echo',
        async run(i) {
          return i;
        },
      },
    });
    const runRes = await server.app.request('/v1/agents/echo/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'x' }),
    });
    const body = (await runRes.json()) as { runId: string };
    const stateRes = await server.app.request(`/v1/runs/${body.runId}/state`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(stateRes.status).toBe(200);
    const snap = (await stateRes.json()) as { runId: string; status: string };
    expect(snap.runId).toBe(body.runId);
    expect(snap.status).toBe('completed');
  });

  it('POST /v1/runs/:runId/abort returns 404 for unknown run + 200 for tracked', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const missing = await server.app.request('/v1/runs/nope/abort', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(missing.status).toBe(404);
    server.runs.declare('tracked-run', { kind: 'agent', agentId: 'echo' });
    const ok = await server.app.request('/v1/runs/tracked-run/abort', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(ok.status).toBe(200);
  });

  it('POST /v1/runs/:runId/resume answers 501 honestly until durable resume lands (IP-14)', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.runs.declare('resume-1', { kind: 'agent', agentId: 'echo' });
    const res = await server.app.request('/v1/runs/resume-1/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    // IP-14: server-side durable resume is not implemented - the old
    // 202 persisted nothing while the client SDK documented it as the
    // durable HITL path. 501 + the library-side pointer is the truth.
    expect(res.status).toBe(501);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('resume-not-implemented');
    const missing = await server.app.request('/v1/runs/missing/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(missing.status).toBe(404);
  });

  it('GET /v1/runs/:runId/state returns 404 for an unknown run', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/runs/nope/state', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(404);
  });

  it('POST /v1/workflows/:id/execute returns 202 with a runId envelope', async () => {
    srv().workflows.register({
      id: 'pipeline',
      workflow: {
        name: 'pipeline',
        execute(): AsyncIterable<unknown> {
          return (async function* () {
            yield { type: 'workflow.start' };
            yield { type: 'workflow.end' };
          })();
        },
      },
    });
    const res = await srv().app.request('/v1/workflows/pipeline/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { x: 1 } }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { runId: string; status: string };
    expect(body.runId).toBeDefined();
  });

  it('POST /v1/workflows/:id/execute returns 404 for unknown workflow', async () => {
    const res = await srv().app.request('/v1/workflows/missing/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(404);
  });

  it('GET /v1/workflows/:id/state requires threadId; returns the workflow state', async () => {
    srv().workflows.register({
      id: 'pipeline',
      workflow: {
        name: 'pipeline',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
        async getState(threadId) {
          return { threadId, status: 'running' };
        },
      },
    });
    const noThread = await srv().app.request('/v1/workflows/pipeline/state', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(noThread.status).toBe(400);

    const ok = await srv().app.request('/v1/workflows/pipeline/state?threadId=t-1', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { state: { threadId: string } };
    expect(body.state.threadId).toBe('t-1');
  });

  it('GET /v1/workflows/:id/checkpoints returns the list', async () => {
    srv().workflows.register({
      id: 'pipeline',
      workflow: {
        name: 'pipeline',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
        async listCheckpoints(threadId) {
          return [{ threadId, checkpointId: 'c-1' }];
        },
      },
    });
    const res = await srv().app.request('/v1/workflows/pipeline/checkpoints?threadId=t-1', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(200);
  });

  it('POST /v1/sessions creates + GET /v1/sessions lists sessions', async () => {
    const created = await srv().app.request('/v1/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', agentId: 'echo' }),
    });
    expect(created.status).toBe(201);
    const list = await srv().app.request('/v1/sessions?userId=u1', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(list.status).toBe(200);
    const body = (await list.json()) as { sessions: ReadonlyArray<unknown> };
    expect(body.sessions.length).toBe(1);
  });

  it('GET /v1/sessions/:id returns 404 for unknown session', async () => {
    const res = await srv().app.request('/v1/sessions/unknown', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(404);
  });

  it('POST /v1/sessions rejects malformed body with 400', async () => {
    const res = await srv().app.request('/v1/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('GET /v1/sessions/:id/messages + handoffs return arrays', async () => {
    const created = await srv().app.request('/v1/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', agentId: 'echo', sessionId: 's1' }),
    });
    expect(created.status).toBe(201);
    const messages = await srv().app.request('/v1/sessions/s1/messages?limit=10', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(messages.status).toBe(200);
    const handoffs = await srv().app.request('/v1/sessions/s1/handoffs', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(handoffs.status).toBe(200);
  });

  it('POST /v1/sessions/:id/export returns the export payload', async () => {
    await srv().app.request('/v1/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', agentId: 'echo', sessionId: 's2' }),
    });
    const res = await srv().app.request('/v1/sessions/s2/export', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ includeAuditEntries: true }),
    });
    expect(res.status).toBe(200);
  });

  it('POST /v1/sessions/:id/replay reaches the REAL handler with both APIs configured (IP-14, DEC-138 ladder intact)', async () => {
    await srv().app.request('/v1/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', agentId: 'echo', sessionId: 's3' }),
    });

    // IP-14: the REAL replay handler serves (the in-sessions stub that
    // shadowed it is gone) - 200 with the loaded events, ladder intact.
    const sanitized = await srv().app.request('/v1/sessions/s3/replay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(sanitized.status).toBe(200);
    const sanitizedBody = (await sanitized.json()) as { events?: unknown[] };
    expect(Array.isArray(sanitizedBody.events)).toBe(true);

    const raw = await srv().app.request('/v1/sessions/s3/replay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: true }),
    });
    expect(raw.status).toBe(200);
  });

  it('POST /v1/memory/search + POST /v1/memory/facts work + accept body', async () => {
    const search = await srv().app.request('/v1/memory/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: { userId: 'u1' }, query: 'hello' }),
    });
    expect(search.status).toBe(200);

    const remember = await srv().app.request('/v1/memory/facts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: { userId: 'u1' }, text: 'fact' }),
    });
    expect(remember.status).toBe(201);
    const body = (await remember.json()) as { fact: { factId: string } };

    const forget = await srv().app.request(`/v1/memory/facts/${body.fact.factId}?userId=u1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(forget.status).toBe(204);
  });

  it('memory routes reject malformed bodies with 400', async () => {
    const res = await srv().app.request('/v1/memory/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('POST /v1/memory/blocks creates + DELETE /v1/memory/blocks/:label removes', async () => {
    const created = await srv().app.request('/v1/memory/blocks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: { userId: 'u1' }, label: 'persona', body: 'You are…' }),
    });
    expect(created.status).toBe(201);
    const removed = await srv().app.request('/v1/memory/blocks/persona?userId=u1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(removed.status).toBe(204);
  });

  it('GET /v1/skills + POST /v1/skills/install round-trip', async () => {
    const list = await srv().app.request('/v1/skills', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(list.status).toBe(200);
    const install = await srv().app.request('/v1/skills/install', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'pdf-extractor' }),
    });
    expect(install.status).toBe(201);
    const get = await srv().app.request('/v1/skills/pdf-extractor', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(get.status).toBe(200);
    const missing = await srv().app.request('/v1/skills/nope', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(missing.status).toBe(404);
  });

  it('GET/POST/DELETE /v1/mcp/servers round-trip', async () => {
    const empty = await srv().app.request('/v1/mcp/servers', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(empty.status).toBe(200);
    const created = await srv().app.request('/v1/mcp/servers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'mcp-1', transport: 'stdio' }),
    });
    expect(created.status).toBe(201);
    const removed = await srv().app.request('/v1/mcp/servers/mcp-1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(removed.status).toBe(204);
    const notFound = await srv().app.request('/v1/mcp/servers/missing', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(notFound.status).toBe(404);
  });

  it('GET /v1/audit returns entries + POST /v1/audit/export returns a payload', async () => {
    const list = await srv().app.request('/v1/audit?limit=5', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(list.status).toBe(200);
    const exp = await srv().app.request('/v1/audit/export', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(exp.status).toBe(200);
  });

  it('POST /v1/tokens mints a fresh token + GET /v1/tokens lists + DELETE revokes', async () => {
    const created = await srv().app.request('/v1/tokens', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopes: ['agents:read'], label: 'ci-bot' }),
    });
    expect(created.status).toBe(201);
    const body = (await created.json()) as { token: { id: string }; raw: string };
    expect(body.raw).toMatch(/^gph_live_v1_/);

    const list = await srv().app.request('/v1/tokens', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(list.status).toBe(200);
    const listBody = (await list.json()) as { tokens: ReadonlyArray<unknown> };
    expect(listBody.tokens.length).toBeGreaterThanOrEqual(2);

    const revoked = await srv().app.request(`/v1/tokens/${body.token.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(revoked.status).toBe(204);
  });

  it('admin scope grants access to every protected route', async () => {
    const res = await srv().app.request('/v1/agents', {
      headers: { Authorization: `Bearer ${adminBearer}` },
    });
    expect(res.status).toBe(200);
  });

  it('returns 401 when no bearer token is supplied', async () => {
    const res = await srv().app.request('/v1/agents');
    expect(res.status).toBe(401);
  });

  it('returns 403 when the granted scopes do not match', async () => {
    const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
    if (store === undefined) throw new Error('store not booted');
    const restricted = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['memory:read'],
    });
    const raw = await restricted.raw.use((v) => v);
    const res = await srv().app.request('/v1/agents', {
      headers: { Authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(403);
  });
});
