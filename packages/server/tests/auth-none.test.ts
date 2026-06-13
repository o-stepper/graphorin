/**
 * IP-13: `auth.kind='none'` (the documented trusted-loopback / single-operator
 * mode) must actually work — every domain route reachable without a token, the
 * WS upgrade mounted instead of silently dropped — and must warn loudly when
 * combined with a non-loopback host.
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { createServer, type GraphorinServer } from '../src/app.js';
import type { ServerAgentLike } from '../src/registry/index.js';

const ECHO: ServerAgentLike = {
  id: 'echo',
  async run(input: unknown) {
    return { input };
  },
};

async function setupStore() {
  return createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
}

let active: GraphorinServer | undefined;

afterEach(async () => {
  if (active !== undefined) {
    await active.stop();
    active = undefined;
  }
});

describe('IP-13 — auth.kind=none serves the authenticated subtree anonymously', () => {
  it('answers domain routes with 200 instead of 401 when no token is presented', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    const store = await setupStore();
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

    // Sanity: health is always open.
    expect((await server.app.request('/v1/health')).status).toBe(200);

    // A scope-gated domain route (agents:read) is reachable with no bearer.
    const list = await server.app.request('/v1/agents');
    expect(list.status).toBe(200);
    const body = (await list.json()) as { agents: ReadonlyArray<{ id: string }> };
    expect(body.agents.map((a) => a.id)).toContain('echo');

    // A scope-gated, side-effecting route (agents:invoke) also serves.
    const run = await server.app.request('/v1/agents/echo/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: { hello: 'world' } }),
    });
    expect(run.ok).toBe(true);
    const runBody = (await run.json()) as { status: string; result: unknown };
    expect(runBody.status).toBe('completed');
  });

  it('mounts the WS upgrade (ws.enabled is never silently ignored) and accepts an anonymous client', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    const store = await setupStore();
    const server = await createServer({
      store,
      skipHardening: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        server: {
          host: '127.0.0.1',
          port: 0,
          rateLimit: { enabled: false },
          csrf: { enabled: false },
          ws: { enabled: true },
        },
      },
    });
    active = server;
    const listening = await server.start();
    const port = listening.port;

    // Connect with ONLY the base subprotocol — no ticket, no bearer.
    const outcome = await new Promise<{ opened: boolean; protocol: string | undefined }>(
      (resolve) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/v1/ws`, ['graphorin.protocol.v1']);
        let opened = false;
        const timer = setTimeout(() => {
          try {
            ws.terminate();
          } catch {
            // ignore
          }
          resolve({ opened, protocol: undefined });
        }, 1_500);
        ws.once('open', () => {
          opened = true;
          const protocol = ws.protocol;
          clearTimeout(timer);
          ws.close();
          resolve({ opened, protocol });
        });
        ws.once('unexpected-response', (_req, res) => {
          clearTimeout(timer);
          resolve({ opened: false, protocol: `http-${res.statusCode}` });
        });
        ws.once('error', () => {
          // 'close'/'open'/'unexpected-response' already resolve; swallow.
        });
      },
    );
    expect(outcome.opened).toBe(true);
    expect(outcome.protocol).toBe('graphorin.protocol.v1');
  });

  it('warns when auth is disabled on a non-loopback host', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    const store = await setupStore();
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map(String).join(' '));
    };
    try {
      const server = await createServer({
        store,
        skipHardening: true,
        skipListen: true,
        config: {
          auth: { kind: 'none' },
          storage: { path: ':memory:', mode: 'lib' },
          server: {
            host: '0.0.0.0',
            rateLimit: { enabled: false },
            csrf: { enabled: false },
            ws: { enabled: false },
          },
        },
      });
      active = server;
      await server.start();
    } finally {
      console.warn = originalWarn;
    }
    expect(warnings.some((w) => w.includes("auth.kind='none'") && w.includes('0.0.0.0'))).toBe(
      true,
    );
  });
});
