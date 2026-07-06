/**
 * IP-15: the Prometheus catalog must be honest - every series in the
 * `/v1/metrics` exposition is either moved by real traffic or absent. This
 * exercises the two newly-wired metrics (run count + duration, idempotency hit
 * ratio) and asserts the five sourceless series are gone.
 *
 * Uses `auth.kind='none'` so the run + metrics routes are reachable without
 * minting a token (IP-13).
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import type { ServerAgentLike } from '../src/registry/index.js';

const ECHO: ServerAgentLike = {
  id: 'echo',
  async run(input: unknown) {
    return { input };
  },
};

let active: GraphorinServer | undefined;

afterEach(async () => {
  if (active !== undefined) {
    await active.stop();
    active = undefined;
  }
});

async function bootNoAuth(): Promise<GraphorinServer> {
  _resetResolversForTesting();
  installBuiltinResolvers();
  const store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  const server = await createServer({
    store,
    skipHardening: true,
    skipListen: true,
    config: {
      auth: { kind: 'none' },
      storage: { path: ':memory:', mode: 'lib' },
      server: {
        rateLimit: { enabled: false },
        csrf: { enabled: false },
        ws: { enabled: false },
      },
    },
  });
  active = server;
  server.agents.register({ id: 'echo', agent: ECHO, description: 'echo agent' });
  await server.start();
  return server;
}

describe('IP-15 - the Prometheus catalog only carries series the server moves', () => {
  it('moves agent_runs_total + agent_run_duration_seconds on a completed run', async () => {
    const server = await bootNoAuth();
    const run = await server.app.request('/v1/agents/echo/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: {} }),
    });
    expect(run.ok).toBe(true);

    const body = await (await server.app.request('/v1/metrics')).text();
    expect(body).toContain('graphorin_agent_runs_total{status="completed"} 1');
    // Summary renders <name>_count / <name>_sum; one observation ⇒ _count 1.
    expect(body).toContain('graphorin_agent_run_duration_seconds_count 1');
  });

  it('publishes idempotency_cache_hit_ratio when a keyed request replays', async () => {
    const server = await bootNoAuth();
    const headers = {
      'content-type': 'application/json',
      'idempotency-key': 'metrics-key-12345',
    };
    const reqBody = JSON.stringify({ input: { x: 1 } });

    const first = await server.app.request('/v1/agents/echo/run', {
      method: 'POST',
      headers,
      body: reqBody,
    });
    expect(first.ok).toBe(true);
    // Identical key + body ⇒ the second call is served from the cache.
    const second = await server.app.request('/v1/agents/echo/run', {
      method: 'POST',
      headers,
      body: reqBody,
    });
    expect(second.headers.get('Idempotency-Replayed')).toBe('true');

    const metrics = await (await server.app.request('/v1/metrics')).text();
    // 1 replay / (1 replay + 1 fresh execution) = 0.5.
    expect(metrics).toContain('graphorin_idempotency_cache_hit_ratio 0.5');
  });

  it('drops the five sourceless series from the exposition', async () => {
    const server = await bootNoAuth();
    const body = await (await server.app.request('/v1/metrics')).text();
    for (const dead of [
      'graphorin_tool_calls_total',
      'graphorin_provider_tokens_total',
      'graphorin_provider_cost_usd_total',
      'graphorin_redaction_drops_total',
      'graphorin_oauth_tokens_freshness_seconds',
    ]) {
      expect(body).not.toContain(dead);
    }
  });
});

describe('W-051 - tools/MCP counter bridge on /v1/metrics', () => {
  it('a tools-package counter surfaces as graphorin_tool_* and re-scrapes idempotently', async () => {
    const { incrementCounter, resetCountersForTesting } = await import('@graphorin/tools/audit');
    resetCountersForTesting();
    try {
      const server = await bootNoAuth();
      incrementCounter('tool.executor.retry.total', { toolName: 'web_fetch' }, 3);

      const first = await (await server.app.request('/v1/metrics')).text();
      expect(first).toContain('graphorin_tool_executor_retry_total{toolName="web_fetch"} 3');

      // Idempotent: nothing new happened - the value must not double.
      const second = await (await server.app.request('/v1/metrics')).text();
      expect(second).toContain('graphorin_tool_executor_retry_total{toolName="web_fetch"} 3');

      // New increments arrive as deltas.
      incrementCounter('tool.executor.retry.total', { toolName: 'web_fetch' });
      const third = await (await server.app.request('/v1/metrics')).text();
      expect(third).toContain('graphorin_tool_executor_retry_total{toolName="web_fetch"} 4');
    } finally {
      resetCountersForTesting();
    }
  });

  it('a gauge bridges with absolute set semantics (can go down)', async () => {
    const { setGauge, resetCountersForTesting } = await import('@graphorin/tools/audit');
    resetCountersForTesting();
    try {
      const server = await bootNoAuth();
      setGauge('tool.result.truncation.first-overrun', 1, { toolName: 'big_tool' });
      const first = await (await server.app.request('/v1/metrics')).text();
      expect(first).toContain(
        'graphorin_tool_result_truncation_first_overrun{toolName="big_tool"} 1',
      );
      setGauge('tool.result.truncation.first-overrun', 0, { toolName: 'big_tool' });
      const second = await (await server.app.request('/v1/metrics')).text();
      expect(second).toContain(
        'graphorin_tool_result_truncation_first_overrun{toolName="big_tool"} 0',
      );
    } finally {
      resetCountersForTesting();
    }
  });
});
