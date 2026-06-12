/**
 * Stress test (scaled-down) — verifies the daemon survives concurrent
 * agent runs + several active triggers + an active replay session
 * without losing state or crashing.
 *
 * The numbers are scaled down from the spec's "100 concurrent runs +
 * 10 cron triggers + 1 active replay session" so the test fits inside
 * the unit-test budget; the structural coverage (registry pressure +
 * scheduler pressure + replay routing) remains the same.
 */

import { createToken } from '@graphorin/security';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { _resetLibModeWarningForTesting, createScheduler, interval } from '@graphorin/triggers';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import type { ReplayApi } from '../src/replay/index.js';
import { createTriggersDaemon } from '../src/triggers/daemon.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_STRESS_PEPPER';
const PEPPER_VALUE = 'stress-pepper-with-enough-bytes-T8mY';

let server: GraphorinServer | undefined;
let store: GraphorinSqliteStore | undefined;

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

describe('Phase 14c — daemon survival under load', () => {
  it('survives 30 concurrent agent runs + 5 trigger fires + 5 sequential replays', {
    timeout: 30_000,
  }, async () => {
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
    await store.init();

    const scheduler = createScheduler({ store: store.triggers, mode: 'server' });
    const replay: ReplayApi = {
      async loadRunReplay(input) {
        await new Promise((r) => setTimeout(r, 1));
        return { events: [{ runId: input.runId }] };
      },
      async loadSessionReplay(input) {
        await new Promise((r) => setTimeout(r, 1));
        return { events: [{ sessionId: input.sessionId }] };
      },
    };

    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      triggers: { daemon: createTriggersDaemon({ scheduler, warn: () => {} }) },
      replay,
      config: {
        auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
        storage: { path: ':memory:', mode: 'lib' },
        server: { rateLimit: { enabled: false }, csrf: { enabled: false } },
      },
    });

    let triggerFires = 0;
    for (let i = 0; i < 5; i++) {
      const id = `cron-${i}`;
      await scheduler.register(
        interval(id, 50, async () => {
          triggerFires += 1;
        }),
      );
    }

    server.agents.register({
      id: 'work',
      agent: {
        id: 'work',
        async run(input) {
          // Tiny work simulation.
          await new Promise((r) => setTimeout(r, 5));
          return { echoed: input };
        },
      },
    });

    await server.start();
    const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
    const minted = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['agents:invoke', 'traces:read:sanitized'],
    });
    const bearer = await minted.raw.use((v) => v);

    const concurrentRuns = 30;
    const runPromises: Promise<unknown>[] = [];
    for (let i = 0; i < concurrentRuns; i++) {
      runPromises.push(
        Promise.resolve(
          server.app.request('/v1/agents/work/run', {
            method: 'POST',
            headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: i }),
          }),
        ),
      );
    }

    const replayPromises: Promise<unknown>[] = [];
    for (let i = 0; i < 5; i++) {
      replayPromises.push(
        Promise.resolve(
          server.app.request(`/v1/runs/replay-${i}/replay`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }),
        ),
      );
    }

    const responses = await Promise.all([...runPromises, ...replayPromises]);

    // Wait briefly so trigger fires happen in the background.
    await new Promise((r) => setTimeout(r, 200));

    for (const res of responses) {
      expect((res as Response).status).toBeGreaterThanOrEqual(200);
      expect((res as Response).status).toBeLessThan(500);
    }
    expect(triggerFires).toBeGreaterThan(0);

    // /v1/health should still return ok / degraded — never failing.
    const health = await server.app.request('/v1/health');
    expect(health.status).toBeLessThan(503);

    // /v1/metrics should still render quickly and contain inflight + uptime counts.
    const metrics = await server.app.request('/v1/metrics');
    expect(metrics.status).toBe(200);
    const body = await metrics.text();
    expect(body).toContain('graphorin_server_uptime_seconds');
    expect(body).toContain('graphorin_inflight_runs');
  });
});
