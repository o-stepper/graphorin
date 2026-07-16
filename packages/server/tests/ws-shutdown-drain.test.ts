/**
 * WS-LIFECY-02 / WS-LIFECY-01 regression: graceful shutdown used to hang
 * forever while any WebSocket client stayed connected. `dispatcher.shutdown()`
 * only sent a lifecycle frame and cleared in-memory state without closing the
 * underlying sockets, so `http.Server.close()` waited on idle subscribers
 * indefinitely and SIGTERM never completed. The fix closes every connected
 * socket with the documented `server.shutdown` close code (4007), which also
 * pins WS-LIFECY-01 (the 4007 code was never emitted on shutdown).
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { createServer, type GraphorinServer } from '../src/app.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_PEPPER_WS_SHUTDOWN';

async function boot(): Promise<{ server: GraphorinServer; port: number; rawToken: string }> {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env[PEPPER_ENV] = 'pepper-with-plenty-of-entropy-aB3xK9-WSDRAIN';
  const store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  const server = await createServer({
    store,
    skipHardening: true,
    config: {
      auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
      storage: { path: ':memory:', mode: 'lib' },
      server: {
        host: '127.0.0.1',
        port: 0,
        rateLimit: { enabled: false },
        csrf: { enabled: false },
      },
    },
  });
  const listening = await server.start();
  const { createToken } = await import('@graphorin/security');
  const { resolveSecret } = await import('@graphorin/security/secrets');
  const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ['sessions:read:*'],
  });
  const rawToken = await minted.raw.use((value) => value);
  return { server, port: listening.port, rawToken };
}

function connect(port: number, rawToken: string): Promise<WebSocket> {
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/v1/ws`, ['graphorin.protocol.v1'], {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

let active: GraphorinServer | undefined;

beforeEach(() => {
  active = undefined;
});

afterEach(async () => {
  if (active !== undefined) {
    await active.stop({ force: true }).catch(() => undefined);
    active = undefined;
  }
  delete process.env[PEPPER_ENV];
});

describe('WS-LIFECY-02 - graceful shutdown drains connected WebSocket clients', () => {
  it('server.stop() completes promptly with an idle WS client connected', async () => {
    const { server, port, rawToken } = await boot();
    active = server;
    const ws = await connect(port, rawToken);
    // Capture the close code the server sends on shutdown (WS-LIFECY-01).
    const closed = new Promise<{ code: number; reason: string }>((resolve) => {
      ws.once('close', (code, reason) => resolve({ code, reason: reason.toString() }));
    });

    const startedAt = Date.now();
    await server.stop();
    active = undefined;
    const elapsed = Date.now() - startedAt;

    // Default drainTimeoutMs is 30s; the graceful path (dispatcher closes
    // the socket) must resolve far below that. A regression would hang until
    // the timeout fallback (or forever), blowing past this bound.
    expect(elapsed).toBeLessThan(5000);

    const { code } = await closed;
    // 4007 == server.shutdown in the @graphorin/protocol close-code taxonomy.
    expect(code).toBe(4007);
  });

  it('server.stop() completes with a subscribed WS client connected', async () => {
    const { server, port, rawToken } = await boot();
    active = server;
    const ws = await connect(port, rawToken);
    ws.send(
      JSON.stringify({
        v: '1',
        jsonrpc: '2.0',
        id: 'sub-1',
        method: 'subscription.subscribe',
        params: { subject: 'session:drain/events' },
      }),
    );
    // Give the subscribe a tick to register on the server.
    await new Promise((r) => setTimeout(r, 50));

    const closed = new Promise<number>((resolve) => {
      ws.once('close', (code) => resolve(code));
    });
    const startedAt = Date.now();
    await server.stop();
    active = undefined;
    expect(Date.now() - startedAt).toBeLessThan(5000);
    expect(await closed).toBe(4007);
  });
});
