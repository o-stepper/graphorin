import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import { createServer } from '../src/app.js';

async function setupStore() {
  return createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
}

describe('POST /v1/session/ws-ticket', () => {
  it('issues a single-use ticket for an authenticated bearer call', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_TEST_PEPPER_WS = 'pepper-with-plenty-of-entropy-aB3xK9-XX1';
    const store = await setupStore();
    const server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER_WS' },
        storage: { path: ':memory:', mode: 'lib' },
        server: {
          rateLimit: { enabled: false },
          csrf: { enabled: false },
        },
      },
    });
    await server.start();

    const { createToken } = await import('@graphorin/security');
    const { resolveSecret } = await import('@graphorin/security/secrets');
    const pepper = await resolveSecret('env:GRAPHORIN_TEST_PEPPER_WS');
    const minted = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['agents:invoke'],
    });
    const raw = await minted.raw.use((value) => value);

    const res = await server.app.request('/v1/session/ws-ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ticket: string; expiresAt: number; ttlMs: number };
    expect(body.ticket).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(body.ttlMs).toBeGreaterThan(0);
    expect(body.expiresAt).toBeGreaterThan(Date.now() - 1_000);

    // Single-use: consume() inside the store should accept it once
    // and then reject.
    const tickets = server.wsTickets;
    expect(tickets).toBeDefined();
    if (tickets === undefined) throw new Error('tickets undefined');
    const first = tickets.consume(body.ticket);
    expect(first.ok).toBe(true);
    const second = tickets.consume(body.ticket);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe('consumed');

    await server.stop();
    delete process.env.GRAPHORIN_TEST_PEPPER_WS;
  });

  it('rejects unauthenticated calls with 401', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_TEST_PEPPER_WS2 = 'pepper-with-plenty-of-entropy-aB3xK9-XX2';
    const store = await setupStore();
    const server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER_WS2' },
        storage: { path: ':memory:', mode: 'lib' },
        server: {
          rateLimit: { enabled: false },
          csrf: { enabled: false },
        },
      },
    });
    await server.start();

    const res = await server.app.request('/v1/session/ws-ticket', { method: 'POST' });
    expect(res.status).toBe(401);

    await server.stop();
    delete process.env.GRAPHORIN_TEST_PEPPER_WS2;
  });

  it('rejects an authenticated token without the agents:invoke scope', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_TEST_PEPPER_WS3 = 'pepper-with-plenty-of-entropy-aB3xK9-XX3';
    const store = await setupStore();
    const server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER_WS3' },
        storage: { path: ':memory:', mode: 'lib' },
        server: {
          rateLimit: { enabled: false },
          csrf: { enabled: false },
        },
      },
    });
    await server.start();

    const { createToken } = await import('@graphorin/security');
    const { resolveSecret } = await import('@graphorin/security/secrets');
    const pepper = await resolveSecret('env:GRAPHORIN_TEST_PEPPER_WS3');
    const minted = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['memory:read'],
    });
    const raw = await minted.raw.use((value) => value);

    const res = await server.app.request('/v1/session/ws-ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(403);

    await server.stop();
    delete process.env.GRAPHORIN_TEST_PEPPER_WS3;
  });
});
