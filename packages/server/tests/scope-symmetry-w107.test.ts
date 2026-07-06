/**
 * W-107 - scope granularity is symmetric across every surface: a token
 * scoped to ONE session reads it over REST and SSE exactly as it
 * already could over WS; run control binds to the run's owning
 * agent/workflow on REST; junk URL segments answer 403, never 500.
 */
import { createToken } from '@graphorin/security/auth';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import type { SessionApi } from '../src/routes/index.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_PEPPER_W107';
const PEPPER_VALUE = 'w107-pepper-bytes-5RcT8nWvXs3fJe9m';

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;

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
});

function sessionStub(): SessionApi {
  const sessions = new Map([
    ['sess-own', { id: 'sess-own', userId: 'u1', agentId: 'a1', messages: [], handoffs: [] }],
    ['sess-other', { id: 'sess-other', userId: 'u2', agentId: 'a1', messages: [], handoffs: [] }],
  ]);
  return {
    async list() {
      return Array.from(sessions.values());
    },
    async get(id: string) {
      return sessions.get(id) ?? null;
    },
    async create(input: { sessionId?: string; userId?: string; agentId?: string }) {
      const id = input.sessionId ?? 'sess-new';
      const meta = { id, userId: input.userId, agentId: input.agentId, messages: [], handoffs: [] };
      sessions.set(id, meta as never);
      return meta;
    },
    async remove(id: string) {
      return sessions.delete(id);
    },
    async listMessages(id: string) {
      return sessions.get(id)?.messages ?? [];
    },
    async listHandoffs(id: string) {
      return sessions.get(id)?.handoffs ?? [];
    },
    async exportSession(id: string) {
      return { sessionId: id };
    },
    async *replaySession(id: string) {
      yield { sessionId: id };
    },
  } as unknown as SessionApi;
}

async function boot(scopes: ReadonlyArray<string>): Promise<string> {
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
    sessions: sessionStub(),
    config: {
      auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
      storage: { path: ':memory:', mode: 'lib' },
      server: { rateLimit: { enabled: false }, csrf: { enabled: false } },
    },
  });
  await server.start();
  const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: [...scopes],
  });
  return await minted.raw.use((v) => v);
}

function get(path: string, bearer: string) {
  if (server === undefined) throw new Error('not booted');
  return server.app.request(path, { headers: { Authorization: `Bearer ${bearer}` } });
}

describe('W-107 - session REST reads are per-resource', () => {
  it('a session-scoped token reads its OWN session and is denied the foreign one', async () => {
    const bearer = await boot(['sessions:read:sess-own']);
    expect((await get('/v1/sessions/sess-own', bearer)).status).toBe(200);
    expect((await get('/v1/sessions/sess-own/messages', bearer)).status).toBe(200);
    expect((await get('/v1/sessions/sess-own/handoffs', bearer)).status).toBe(200);
    expect((await get('/v1/sessions/sess-other', bearer)).status).toBe(403);
    expect((await get('/v1/sessions/sess-other/messages', bearer)).status).toBe(403);
    // The global list stays an administrative two-segment read.
    expect((await get('/v1/sessions', bearer)).status).toBe(403);
  });

  it('a bare sessions:read grant keeps reading everything (two covers three)', async () => {
    const bearer = await boot(['sessions:read']);
    expect((await get('/v1/sessions', bearer)).status).toBe(200);
    expect((await get('/v1/sessions/sess-own', bearer)).status).toBe(200);
    expect((await get('/v1/sessions/sess-other', bearer)).status).toBe(200);
  });

  it('junk URL segments answer 403 scope-denied, never 500', async () => {
    const bearer = await boot(['sessions:read']);
    const bad = await get('/v1/sessions/%40bad%20id', bearer);
    expect(bad.status).toBe(403);
    const long = await get(`/v1/sessions/${'x'.repeat(200)}`, bearer);
    expect(long.status).toBe(403);
  });

  it('SSE mirrors the WS per-resource gate', async () => {
    const bearer = await boot(['sessions:read:sess-own']);
    const denied = await get('/v1/sessions/sess-other/events', bearer);
    expect(denied.status).toBe(403);
    // The own-session stream opens (SSE responses stream; status is
    // enough here - the frame plumbing is covered by routes-sse tests).
    const controller = new AbortController();
    const ok = await server?.app.request('/v1/sessions/sess-own/events', {
      headers: { Authorization: `Bearer ${bearer}` },
      signal: controller.signal,
    });
    expect(ok?.status).toBe(200);
    controller.abort();
  });
});

describe('W-107 - run control binds to the owning resource', () => {
  it('state/abort with a foreign three-segment grant answer 403; bare grants keep working', async () => {
    const bearer = await boot(['agents:read', 'agents:invoke']);
    const runId = 'run-w107';
    server?.runs.start(runId, { kind: 'agent', agentId: 'agent-a' });

    // Bare two-segment grants cover the per-resource requirement.
    expect((await get(`/v1/runs/${runId}/state`, bearer)).status).toBe(200);

    const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
    if (store === undefined) throw new Error('no store');
    const foreign = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['agents:read:agent-z', 'agents:invoke:agent-z'],
    });
    const foreignBearer = await foreign.raw.use((v) => v);
    expect((await get(`/v1/runs/${runId}/state`, foreignBearer)).status).toBe(403);
    const abortRes = await server?.app.request(`/v1/runs/${runId}/abort`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${foreignBearer}` },
    });
    expect(abortRes?.status).toBe(403);

    const owner = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['agents:read:agent-a', 'agents:invoke:agent-a'],
    });
    const ownerBearer = await owner.raw.use((v) => v);
    expect((await get(`/v1/runs/${runId}/state`, ownerBearer)).status).toBe(200);
    const ownAbort = await server?.app.request(`/v1/runs/${runId}/abort`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerBearer}` },
    });
    expect(ownAbort?.status).toBe(200);
  });

  it('an unknown runId answers 404 before any scope evaluation', async () => {
    const bearer = await boot(['agents:read:agent-z']);
    expect((await get('/v1/runs/run-unknown/state', bearer)).status).toBe(404);
  });
});
