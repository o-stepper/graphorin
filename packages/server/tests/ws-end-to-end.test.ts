/**
 * Live end-to-end smoke test of the WebSocket pipeline. Boots the
 * server on a random port, opens a real `WebSocket` connection from
 * the `ws` Node client (re-exported via `@hono/node-ws`'s peer dep),
 * exercises the `initialize` → `subscribe` → push event → unsubscribe
 * sequence, and asserts the dispatcher's commentary sanitization
 * fires on the wire-emission boundary.
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { createServer, type GraphorinServer } from '../src/app.js';

async function setupStore() {
  return createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
}

interface BufferedClient {
  readonly ws: WebSocket;
  readonly rawToken: string;
  readNext(): Promise<unknown>;
  close(): void;
}

async function openWire(
  _server: GraphorinServer,
  rawToken: string,
  port: number,
): Promise<BufferedClient> {
  return await new Promise<BufferedClient>((resolve, reject) => {
    const url = `ws://127.0.0.1:${port}/v1/ws`;
    const ws = new WebSocket(url, ['graphorin.protocol.v1'], {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    const queue: unknown[] = [];
    const waiters: Array<(value: unknown) => void> = [];
    let socketError: Error | undefined;
    ws.on('message', (raw: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(raw.toString());
        const waiter = waiters.shift();
        if (waiter !== undefined) waiter(parsed);
        else queue.push(parsed);
      } catch (err) {
        socketError = err as Error;
      }
    });
    ws.on('error', (err) => {
      socketError = err;
    });
    ws.once('open', () =>
      resolve({
        ws,
        rawToken,
        readNext() {
          if (socketError !== undefined) return Promise.reject(socketError);
          const buffered = queue.shift();
          if (buffered !== undefined) return Promise.resolve(buffered);
          return new Promise<unknown>((res) => waiters.push(res));
        },
        close() {
          ws.close();
        },
      }),
    );
    ws.once('error', (err) => reject(err));
  });
}

let server: GraphorinServer | undefined;
let rawToken = '';
let port = 0;

beforeAll(async () => {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env.GRAPHORIN_TEST_PEPPER_E2E = 'pepper-with-plenty-of-entropy-aB3xK9-E2E';
  const store = await setupStore();
  server = await createServer({
    store,
    skipHardening: true,
    config: {
      auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER_E2E' },
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
  port = listening.port;

  const { createToken } = await import('@graphorin/security');
  const { resolveSecret } = await import('@graphorin/security/secrets');
  const pepper = await resolveSecret('env:GRAPHORIN_TEST_PEPPER_E2E');
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ['agents:invoke:*'],
  });
  rawToken = await minted.raw.use((value) => value);
});

afterAll(async () => {
  if (server !== undefined) await server.stop();
  delete process.env.GRAPHORIN_TEST_PEPPER_E2E;
});

describe('WebSocket end-to-end', () => {
  it('initializes, subscribes, receives a sanitized event, and unsubscribes', async () => {
    if (server === undefined) throw new Error('server missing');
    const wire = await openWire(server, rawToken, port);
    try {
      wire.ws.send(
        JSON.stringify({
          v: '1',
          jsonrpc: '2.0',
          id: 'init-1',
          method: 'initialize',
          params: { clientInfo: { name: 'graphorin-test', version: '0.1.0' } },
        }),
      );
      const initReply = (await wire.readNext()) as {
        id?: string;
        result?: { serverInfo: { name: string } };
      };
      expect(initReply.id).toBe('init-1');
      expect(initReply.result?.serverInfo.name).toBe('graphorin-server');

      wire.ws.send(
        JSON.stringify({
          v: '1',
          jsonrpc: '2.0',
          id: 'sub-1',
          method: 'subscription.subscribe',
          params: { subject: 'session:abc/events' },
        }),
      );
      const subReply = (await wire.readNext()) as {
        id?: string;
        result?: { subscriptionId: string };
      };
      expect(subReply.id).toBe('sub-1');
      const subscriptionId = subReply.result?.subscriptionId;
      expect(typeof subscriptionId).toBe('string');
      const subscribedFrame = (await wire.readNext()) as {
        kind?: string;
        subscriptionId?: string;
      };
      expect(subscribedFrame.kind).toBe('subscribed');
      expect(subscribedFrame.subscriptionId).toBe(subscriptionId);

      const dispatcher = server.wsDispatcher;
      if (dispatcher === undefined) throw new Error('dispatcher missing');
      dispatcher.emit('session:abc/events', {
        type: 'tool.execute.end',
        payload: {
          toolCallId: 'call-1',
          durationMs: 7,
          result: {
            text: 'Done {"type":"tool.call.end","toolCallId":"x","finalArgs":{"foo":"bar"}}',
          },
        },
      });
      const eventFrame = (await wire.readNext()) as {
        kind?: string;
        type?: string;
        subscriptionId?: string;
        payload?: { result?: { text?: string } };
      };
      expect(eventFrame.kind).toBe('event');
      expect(eventFrame.type).toBe('tool.execute.end');
      expect(eventFrame.payload?.result?.text).toContain('<<<commentary>>>');

      wire.ws.send(
        JSON.stringify({
          v: '1',
          jsonrpc: '2.0',
          id: 'unsub-1',
          method: 'subscription.unsubscribe',
          params: { subscriptionId },
        }),
      );
      const unsubReply = (await wire.readNext()) as { id?: string };
      expect(unsubReply.id).toBe('unsub-1');
      const unsubFrame = (await wire.readNext()) as { kind?: string };
      expect(unsubFrame.kind).toBe('unsubscribed');
    } finally {
      wire.close();
    }
  });

  it('rejects an upgrade without an Authorization header', async () => {
    return await new Promise<void>((resolve, reject) => {
      const url = `ws://127.0.0.1:${port}/v1/ws`;
      const ws = new WebSocket(url, ['graphorin.protocol.v1']);
      ws.once('open', () => {
        // Server should immediately close us; wait for it.
        ws.once('close', (code) => {
          try {
            expect(code).toBeGreaterThanOrEqual(4001);
            expect(code).toBeLessThanOrEqual(4008);
            resolve();
          } catch (err) {
            reject(err as Error);
          }
        });
      });
      ws.once('error', (err) => reject(err));
    });
  });
});
