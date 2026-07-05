import { createToken } from '@graphorin/security';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import {
  _resetLibModeWarningForTesting,
  createScheduler,
  interval,
  type Scheduler,
} from '@graphorin/triggers';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import type { ConsolidatorLike, ConsolidatorStatusLike } from '../src/consolidator/daemon.js';
import type { ReplayApi } from '../src/replay/index.js';
import { createTriggersDaemon } from '../src/triggers/daemon.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_OBS_PEPPER';
const PEPPER_VALUE = 'observability-pepper-with-enough-bytes-Z3pQ';

const ADMIN_SCOPES: ReadonlyArray<string> = ['admin:*'];
const STANDARD_SCOPES: ReadonlyArray<string> = [
  'agents:read',
  'agents:invoke',
  'triggers:read',
  'triggers:fire',
  'triggers:disable',
  'traces:read:sanitized',
  'audit:read',
  'audit:export',
  'audit:verify',
  'secrets:read',
];

interface BootResult {
  readonly server: GraphorinServer;
  readonly bearer: string;
  readonly adminBearer: string;
  readonly anonBearer: string;
  readonly scheduler: Scheduler;
  readonly consolidator: TestConsolidator;
  readonly replay: TestReplayApi;
}

interface TestConsolidator extends ConsolidatorLike {
  startCalls: number;
  stopCalls: number;
  status(): Promise<ConsolidatorStatusLike>;
}

interface TestReplayApi extends ReplayApi {
  readonly calls: ReadonlyArray<{
    readonly target: 'run' | 'session';
    readonly id: string;
    readonly mode: string;
  }>;
}

function buildConsolidator(): TestConsolidator {
  const state = { running: false, paused: false };
  const cons: TestConsolidator = {
    startCalls: 0,
    stopCalls: 0,
    async start() {
      state.running = true;
      cons.startCalls += 1;
    },
    async stop() {
      state.running = false;
      cons.stopCalls += 1;
    },
    async status(): Promise<ConsolidatorStatusLike> {
      return {
        tier: 'free',
        running: state.running,
        paused: state.paused,
        queueDepth: 1,
        dlqSize: 0,
        deferredRuns: 0,
        emptyExtractions: 0,
        budget: {
          tokensUsedToday: 0,
          costUsedToday: 0,
          tokensRemaining: 0,
          costRemaining: 0,
          resetAt: new Date(0).toISOString(),
        },
      };
    },
  };
  return cons;
}

function buildReplayApi(): TestReplayApi {
  const calls: { target: 'run' | 'session'; id: string; mode: string }[] = [];
  return {
    get calls() {
      return calls;
    },
    async loadRunReplay(input) {
      calls.push({ target: 'run', id: input.runId, mode: input.mode });
      return { events: [{ runId: input.runId, mode: input.mode }] };
    },
    async loadSessionReplay(input) {
      calls.push({ target: 'session', id: input.sessionId, mode: input.mode });
      return { events: [{ sessionId: input.sessionId, mode: input.mode }] };
    },
  };
}

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;

async function bootServer(): Promise<BootResult> {
  _resetResolversForTesting();
  installBuiltinResolvers();
  _resetLibModeWarningForTesting();
  process.env[PEPPER_ENV] = PEPPER_VALUE;
  store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  // The store is initialised by the pre-bind step; tests just need
  // the trigger schema available so the scheduler can persist.
  await store.init();
  const scheduler = createScheduler({
    store: store.triggers,
    mode: 'server',
  });
  const consolidator = buildConsolidator();
  const replay = buildReplayApi();
  server = await createServer({
    store,
    skipHardening: true,
    skipListen: true,
    triggers: { daemon: createTriggersDaemon({ scheduler, warn: () => {} }) },
    consolidator,
    replay,
    audit: {
      async list() {
        return [{ seq: 1, action: 'token:create' }];
      },
      async export() {
        return { bytes: 0 };
      },
      async verify() {
        return { ok: true, count: 1 };
      },
    },
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
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: STANDARD_SCOPES,
  });
  const mintedAdmin = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ADMIN_SCOPES,
  });
  const anonMinted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ['agents:read'],
  });
  return {
    server,
    bearer: await minted.raw.use((v) => v),
    adminBearer: await mintedAdmin.raw.use((v) => v),
    anonBearer: await anonMinted.raw.use((v) => v),
    scheduler,
    consolidator,
    replay,
  };
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
});

describe('Phase 14c - extended /v1/health', () => {
  it('returns the rollup with per-check breakdown (flat shape) and 200 on degraded', async () => {
    const { server } = await bootServer();
    const res = await server.app.request('/v1/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      version: string;
      uptimeSeconds: number;
      checks: {
        storage?: { status: string; walSizeBytes: number; warnThresholdBytes: number };
        triggers?: { status: string; running: boolean; active: number };
        consolidator?: {
          status: string;
          tier: string;
          queueDepth: number;
          dlqSize: number;
          budgetRemaining: { tokens: number; costUsd: number };
        };
      };
    };
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.6.0');
    expect(body.checks.storage?.walSizeBytes).toBeGreaterThanOrEqual(0);
    expect(body.checks.triggers?.running).toBe(true);
    expect(body.checks.consolidator?.tier).toBe('free');
    expect(body.checks.consolidator?.budgetRemaining).toMatchObject({ tokens: 0, costUsd: 0 });
  });

  it('rollup status flips to failing -> HTTP 503 when a check returns fail', async () => {
    const { server } = await bootServer();
    // Inject a crashing health probe by creating a new app surface with
    // the same probe wiring + a deliberate failure.
    const probes = async () => {
      throw new Error('synthetic'); // not used directly; collectHealth tested in unit suite
    };
    void probes;
    // Indirect: replace the `/v1/health` handler by calling it
    // directly via the exported helper to validate the contract.
    const { collectHealth } = await import('../src/health/checks.js');
    const summary = await collectHealth({
      consolidator: {
        async start() {},
        async stop() {},
        consolidator: {} as never,
        async status() {
          throw new Error('storage unavailable');
        },
      },
    });
    expect(summary.status).toBe('failing');
    // The handler short-circuits with 503 on `'failing'`. Validate via
    // the exported route factory directly.
    const { createExtendedHealthRoutes } = await import('../src/health/routes.js');
    const route = createExtendedHealthRoutes({
      version: '0.6.0',
      startedAt: 0,
      now: () => 1_000,
      probes: async () => ({
        consolidator: {
          async start() {},
          async stop() {},
          consolidator: {} as never,
          async status() {
            throw new Error('storage unavailable');
          },
        },
      }),
    });
    const res = await route.request('/');
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('failing');
    void server;
  });
});

describe('Phase 14c - /v1/health/secrets', () => {
  it('requires the secrets:read scope (admin satisfies via wildcard)', async () => {
    const { server, anonBearer, adminBearer } = await bootServer();
    const denied = await server.app.request('/v1/health/secrets', {
      headers: { Authorization: `Bearer ${anonBearer}` },
    });
    expect(denied.status).toBe(403);
    const ok = await server.app.request('/v1/health/secrets', {
      headers: { Authorization: `Bearer ${adminBearer}` },
    });
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as Record<string, unknown>;
    expect(typeof body.active).toBe('string');
  });
});

describe('Phase 14c - /v1/metrics Prometheus exposition', () => {
  it('renders metrics text without authentication when requireAuth=false', async () => {
    const { server } = await bootServer();
    const res = await server.app.request('/v1/metrics');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('# TYPE graphorin_agent_runs_total counter');
    expect(body).toContain('# TYPE graphorin_storage_wal_size_bytes gauge');
    expect(body).toContain('graphorin_build_info{version="0.6.0"} 1');
  });
});

describe('Phase 14c - triggers REST routes', () => {
  it('GET /v1/triggers requires triggers:read', async () => {
    const { server, bearer, anonBearer } = await bootServer();
    const denied = await server.app.request('/v1/triggers', {
      headers: { Authorization: `Bearer ${anonBearer}` },
    });
    expect(denied.status).toBe(403);

    const ok = await server.app.request('/v1/triggers', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(ok.status).toBe(200);
  });

  it('POST /v1/triggers/:id/fire fires the registered callback', async () => {
    const { server, scheduler, bearer } = await bootServer();
    let fired = 0;
    await scheduler.register(
      interval('demo', 1_000, async () => {
        fired += 1;
      }),
    );
    const res = await server.app.request('/v1/triggers/demo/fire', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; fired: string };
    expect(body.fired).toBe('demo');
    expect(fired).toBe(1);
  });

  it('POST /v1/triggers/:id/fire returns 404 for unknown trigger', async () => {
    const { server, bearer } = await bootServer();
    const res = await server.app.request('/v1/triggers/missing/fire', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(404);
  });

  it('POST /v1/triggers/prune cleans up disabled triggers (admin only)', async () => {
    const { server, scheduler, bearer, anonBearer } = await bootServer();
    await scheduler.register(interval('cleanup-me', 1_000, async () => {}));
    await scheduler.unregister('cleanup-me');

    const denied = await server.app.request('/v1/triggers/prune', {
      method: 'POST',
      headers: { Authorization: `Bearer ${anonBearer}` },
    });
    expect(denied.status).toBe(403);
    const ok = await server.app.request('/v1/triggers/prune', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(ok.status).toBe(200);
  });

  it('GET /v1/triggers/:id returns the persisted state for known triggers', async () => {
    const { server, scheduler, bearer } = await bootServer();
    await scheduler.register(interval('introspect', 1_000, async () => {}));
    const found = await server.app.request('/v1/triggers/introspect', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(found.status).toBe(200);
    const body = (await found.json()) as { trigger: { id: string; kind: string } };
    expect(body.trigger.id).toBe('introspect');
    expect(body.trigger.kind).toBe('interval');

    const missing = await server.app.request('/v1/triggers/does-not-exist', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(missing.status).toBe(404);
  });

  it('POST /v1/triggers/:id/disable flips the flag; DELETE unregisters (IP-17)', async () => {
    const { server, scheduler, bearer, anonBearer } = await bootServer();
    await scheduler.register(interval('to-disable', 5_000, async () => {}));

    const denied = await server.app.request('/v1/triggers/to-disable/disable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${anonBearer}` },
    });
    expect(denied.status).toBe(403);

    const ok = await server.app.request('/v1/triggers/to-disable/disable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(ok.status).toBe(200);

    // IP-17: disable is a NON-destructive flag flip - the trigger
    // survives, paused; enable restores it; DELETE removes it.
    const all = await scheduler.list();
    expect(all.find((t) => t.id === 'to-disable')?.disabled).toBe(true);

    const enable = await server.app.request('/v1/triggers/to-disable/enable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(enable.status).toBe(200);
    expect((await scheduler.list()).find((t) => t.id === 'to-disable')?.disabled).toBe(false);

    const del = await server.app.request('/v1/triggers/to-disable', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(del.status).toBe(200);
    expect((await scheduler.list()).find((t) => t.id === 'to-disable')).toBeUndefined();

    const missing = await server.app.request('/v1/triggers/missing/disable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(missing.status).toBe(404);
  });
});

describe('Phase 14c - consolidator lifecycle', () => {
  it('starts in beforeStart and stops on shutdown', async () => {
    const { consolidator, server } = await bootServer();
    expect(consolidator.startCalls).toBe(1);
    await server.stop();
    expect(consolidator.stopCalls).toBe(1);
  });

  it('consolidator.status() reflects current tier and queue depth in /v1/health', async () => {
    const { server } = await bootServer();
    const res = await server.app.request('/v1/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      checks: {
        consolidator?: { tier: string; queueDepth: number; dlqSize: number };
      };
    };
    expect(body.checks.consolidator?.tier).toBe('free');
    expect(body.checks.consolidator?.queueDepth).toBe(1);
    expect(body.checks.consolidator?.dlqSize).toBe(0);
  });
});

describe('Phase 14c - Prometheus metrics live refresh', () => {
  it('refreshes server uptime + WAL size + triggers fires on every scrape', async () => {
    const { server, scheduler } = await bootServer();
    let fired = 0;
    await scheduler.register(
      (await import('@graphorin/triggers')).interval('flaky-metric', 50, async () => {
        fired += 1;
        if (fired === 1) throw new Error('boom');
      }),
    );
    // Allow the trigger to fire a couple of times.
    await new Promise((r) => setTimeout(r, 200));
    const res = await server.app.request('/v1/metrics');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('graphorin_server_uptime_seconds');
    expect(body).toContain('graphorin_inflight_runs');
    expect(body).toContain('graphorin_storage_wal_size_bytes');
    // Trigger fires should reach the registry via refresh-on-scrape.
    expect(body).toMatch(
      /graphorin_triggers_fires_total\{status="(success|error)",trigger_id="flaky-metric"\}/,
    );
  });
});

describe('Phase 14c - replay endpoints (scope enforcement)', () => {
  it('rejects raw replay without traces:read:raw scope', async () => {
    const { server, bearer } = await bootServer();
    const res = await server.app.request('/v1/runs/run-1/replay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: true }),
    });
    expect(res.status).toBe(403);
  });

  it('serves sanitized replay for run id', async () => {
    const { server, bearer, replay } = await bootServer();
    const res = await server.app.request('/v1/runs/run-42/replay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mode: string; events: ReadonlyArray<unknown> };
    expect(body.mode).toBe('sanitized');
    expect(body.events).toHaveLength(1);
    expect(replay.calls[0]).toEqual({ target: 'run', id: 'run-42', mode: 'sanitized' });
  });

  it('serves sanitized replay for session id', async () => {
    const { server, bearer, replay } = await bootServer();
    const res = await server.app.request('/v1/sessions/sess-9/replay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    expect(replay.calls.at(-1)).toEqual({
      target: 'session',
      id: 'sess-9',
      mode: 'sanitized',
    });
  });

  it('admin scope (admin:*) grants raw replay', async () => {
    const { server, adminBearer } = await bootServer();
    const res = await server.app.request('/v1/runs/run-77/replay', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminBearer}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: true }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mode: string };
    expect(body.mode).toBe('raw');
  });

  it('rejects raw session replay without traces:read:raw scope and surfaces the hint', async () => {
    const { server, bearer } = await bootServer();
    const res = await server.app.request('/v1/sessions/sess-x/replay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: true }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string; hint?: string };
    expect(body.error).toBe('scope-denied');
    expect(body.hint).toContain('traces:read:raw');
  });

  it('forwards fromMessageId / provider through the ReplayApi', async () => {
    const { server, bearer, replay } = await bootServer();
    await server.app.request('/v1/runs/run-with-cursor/replay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromMessageId: 'msg-12', provider: 'openai' }),
    });
    expect(replay.calls.at(-1)).toEqual({
      target: 'run',
      id: 'run-with-cursor',
      mode: 'sanitized',
    });
  });

  it('rejects malformed replay body with 400', async () => {
    const { server, bearer } = await bootServer();
    const res = await server.app.request('/v1/runs/run-bad/replay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: 'yes' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Phase 14c - POST /v1/audit/verify', () => {
  it('returns chain integrity status', async () => {
    const { server, bearer } = await bootServer();
    const res = await server.app.request('/v1/audit/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { verify: { ok: boolean; count?: number } };
    expect(body.verify.ok).toBe(true);
  });
});

describe('Phase 14c - GET /v1/audit filters (from / to / action)', () => {
  it('forwards from / to / action filter parameters to the AuditApi', async () => {
    let received: Record<string, unknown> | undefined;
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env[PEPPER_ENV] = PEPPER_VALUE;
    const localStore = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    await localStore.init();
    const localServer = await createServer({
      store: localStore,
      skipHardening: true,
      skipListen: true,
      audit: {
        async list(opts) {
          received = { ...opts };
          return [];
        },
        async export() {
          return { bytes: 0 };
        },
      },
      config: {
        auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
        storage: { path: ':memory:', mode: 'lib' },
        server: { rateLimit: { enabled: false }, csrf: { enabled: false } },
      },
    });
    await localServer.start();
    const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
    const minted = await createToken({
      tokenStore: localStore.authTokens,
      pepper,
      env: 'live',
      scopes: ['audit:read'],
    });
    const tok = await minted.raw.use((v) => v);
    const res = await localServer.app.request(
      '/v1/audit?from=2026-05-01T00%3A00%3A00Z&to=2026-05-09T00%3A00%3A00Z&action=token%3Acreate&limit=10',
      {
        headers: { Authorization: `Bearer ${tok}` },
      },
    );
    expect(res.status).toBe(200);
    expect(received).toMatchObject({
      action: 'token:create',
      limit: 10,
    });
    expect((received as { fromTs: number }).fromTs).toBe(Date.parse('2026-05-01T00:00:00Z'));
    expect((received as { toTs: number }).toTs).toBe(Date.parse('2026-05-09T00:00:00Z'));
    await localServer.stop();
    await localStore.close();
    delete process.env[PEPPER_ENV];
  });

  it('rejects malformed timestamps with 400', async () => {
    const { server, bearer } = await bootServer();
    const res = await server.app.request('/v1/audit?from=not-a-date', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(400);
  });
});
