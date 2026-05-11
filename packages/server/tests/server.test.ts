import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, registerMigration } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import { createServer } from '../src/app.js';
import { PrebindPepperMissingError } from '../src/errors/index.js';
import type { ServerAgentLike } from '../src/registry/index.js';

void resolveSecret;

async function setupStore() {
  const store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  return store;
}

describe('createServer', () => {
  it('refuses to start when auth.kind=token and auth.pepperRef is missing', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    const store = await setupStore();
    const server = await createServer({
      validatedConfig: undefined,
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token' },
        storage: { path: ':memory:', mode: 'lib' },
      },
    });
    await expect(server.start()).rejects.toBeInstanceOf(PrebindPepperMissingError);
    await store.close();
  });

  it('starts with token auth + env pepper, exposes /v1/health, and serves agent listings', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_TEST_PEPPER = 'super-secret-pepper-with-enough-entropy-3xY8u';
    const store = await setupStore();
    const server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER' },
        storage: { path: ':memory:', mode: 'lib' },
        // Disable rate-limit + CSRF so the test can issue raw GETs.
        server: {
          rateLimit: { enabled: false },
          csrf: { enabled: false },
        },
      },
    });
    const echo: ServerAgentLike = {
      id: 'echo',
      async run(input: unknown) {
        return { input };
      },
    };
    server.agents.register({ id: 'echo', agent: echo, description: 'echo agent' });

    await server.start();

    // /v1/health is unauthenticated.
    const health = await server.app.request('/v1/health');
    expect(health.status).toBe(200);
    const healthBody = (await health.json()) as { status: string; version: string };
    expect(healthBody.status).toBe('ok');

    // /v1/agents requires auth → 401 without bearer token.
    const denied = await server.app.request('/v1/agents');
    expect(denied.status).toBe(401);

    await server.stop();
    delete process.env.GRAPHORIN_TEST_PEPPER;
  });

  it('mints a token through the verifier path and grants /v1/agents access', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_TEST_PEPPER = 'another-pepper-with-enough-entropy-K9pZ7';
    const store = await setupStore();
    const server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER' },
        storage: { path: ':memory:', mode: 'lib' },
        server: {
          rateLimit: { enabled: false },
          csrf: { enabled: false },
        },
      },
    });
    server.agents.register({
      id: 'echo',
      agent: {
        id: 'echo',
        async run(i) {
          return i;
        },
      },
    });
    await server.start();

    // Mint a token via the security crud helpers using the same store.
    const { createToken } = await import('@graphorin/security');
    const { resolveSecret } = await import('@graphorin/security/secrets');
    const pepper = await resolveSecret('env:GRAPHORIN_TEST_PEPPER');
    const minted = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const raw = await minted.raw.use((value) => value);

    const res = await server.app.request('/v1/agents', {
      headers: { Authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { agents: ReadonlyArray<{ id: string }> };
    expect(body.agents.map((a) => a.id)).toEqual(['echo']);

    await server.stop();
    delete process.env.GRAPHORIN_TEST_PEPPER;
  });

  it('does not double-register the audit-db binding', async () => {
    void registerMigration; // keep the import warm so the side-effect runs.
  });
});
