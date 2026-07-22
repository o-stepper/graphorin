/**
 * ConcurrentRunError mapping on POST /v1/agents/:id/run: a busy
 * single-flight agent instance is a client-addressable contention
 * condition and must surface as 409 `agent-busy` (the mapping the
 * resume route always had), never as 500 `run-failed`. Found by the
 * soak leg: unpaced load against one instance read a documented guard
 * as an outage.
 */

import { createAgent } from '@graphorin/agent';
import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { createToken } from '@graphorin/security';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_BUSY_PEPPER';
const PEPPER_VALUE = 'busy-pepper-with-enough-bytes-Q7pR2vX';

let server: GraphorinServer | undefined;
let store: GraphorinSqliteStore | undefined;
let bearer: string | undefined;

/** A provider whose stream parks until `release()` fires. */
function blockingProvider(): { provider: Provider; release: () => void } {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const provider: Provider = {
    name: 'blocking',
    modelId: 'blocking-1',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 8192,
      maxOutput: 4096,
    },
    async *stream(_req: ProviderRequest): AsyncIterable<ProviderEvent> {
      await gate;
      yield { type: 'stream-start', metadata: { providerName: 'blocking', modelId: 'blocking-1' } };
      yield { type: 'text-delta', delta: 'done' };
      yield {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      };
    },
    async generate(): Promise<ProviderResponse> {
      throw new Error('use stream');
    },
  };
  return { provider, release };
}

beforeEach(async () => {
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
    scopes: ['agents:read', 'agents:invoke'],
  });
  bearer = await minted.raw.use((v) => v);
});

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
});

function srv(): GraphorinServer {
  if (server === undefined) throw new Error('not booted');
  return server;
}

function auth(): Record<string, string> {
  return { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' };
}

describe('POST /v1/agents/:id/run under a busy instance', () => {
  it('returns 409 agent-busy while a run is in flight, then 200 once free', async () => {
    const { provider, release } = blockingProvider();
    const agent = createAgent({ name: 'busy', instructions: 'work', provider });
    srv().agents.register({ id: 'busy', description: 'single-flight agent', agent });

    const first = srv().app.request('/v1/agents/busy/run', {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ input: 'one' }),
    });
    // Let the first run reach the provider gate before the contender.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const second = await srv().app.request('/v1/agents/busy/run', {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ input: 'two' }),
    });
    expect(second.status).toBe(409);
    const busyBody = (await second.json()) as { error?: string; message?: string; runId?: string };
    expect(busyBody.error).toBe('agent-busy');
    expect(busyBody.message).toMatch(/already has a run in flight/);
    expect(busyBody.runId).toBeTruthy();

    release();
    const firstRes = await first;
    expect(firstRes.status).toBe(200);
    const firstBody = (await firstRes.json()) as { status?: string };
    expect(firstBody.status).toBe('completed');

    // The instance is free again - a fresh run succeeds.
    const third = await srv().app.request('/v1/agents/busy/run', {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ input: 'three' }),
    });
    expect(third.status).toBe(200);
  });
});
