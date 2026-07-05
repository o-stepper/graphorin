/**
 * Coverage-targeted tests for `GraphorinClient` paths the higher-
 * level mock-WS suite does not exercise: SSE-mode subscribe rejection,
 * subject-shape assertions, transport-kind getter, ping reply, and
 * the "auto" fallback behaviour from WS to SSE.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ClientNotConnectedError, TransportFailedError } from '../src/errors.js';
import { GraphorinClient } from '../src/graphorin-client.js';
import { MockEventSource, resetMockEventSource } from './__fixtures__/mock-event-source.js';
import { lastSocket, MockWebSocket, resetMockTransport } from './__fixtures__/mock-websocket.js';

beforeEach(() => {
  resetMockTransport();
  resetMockEventSource();
});
afterEach(() => {
  resetMockTransport();
  resetMockEventSource();
});

const FAKE_WS = MockWebSocket as unknown as typeof WebSocket;

/** Minimal streaming fetch stub for the rewritten fetch-based SSE transport. */
function sseFetchStub(capture?: { headers?: Record<string, string>; url?: string }): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (capture !== undefined) {
      capture.url = String(input);
      capture.headers = Object.fromEntries(
        Object.entries((init?.headers ?? {}) as Record<string, string>),
      );
    }
    const body = new ReadableStream<Uint8Array>({
      start() {
        // stays open; the client closes it
      },
    });
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  }) as typeof fetch;
}

const FAKE_ES = MockEventSource as unknown as typeof EventSource;

async function ackInitialize(): Promise<void> {
  for (let i = 0; i < 50; i += 1) {
    await Promise.resolve();
    const socket = lastSocket();
    const last = socket.sent.at(-1);
    if (last === undefined) continue;
    const parsed = JSON.parse(last) as { method?: string; id?: string };
    if (parsed.method === 'initialize') {
      socket.fireMessage({
        v: '1',
        jsonrpc: '2.0',
        id: parsed.id ?? '0',
        result: { serverInfo: { name: 'graphorin-server', version: '0.1.0' } },
      });
      return;
    }
  }
  throw new Error('No initialize frame seen.');
}

describe('GraphorinClient - SSE / fallback / misc', () => {
  it('SSE subscribe serves the BOUND session and rejects other subjects (IP-3)', async () => {
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'bearer', token: 't' },
      transport: 'sse',
      sessionId: 'a',
      fetch: sseFetchStub(),
    });
    await client.connect();
    expect(client.transportKind).toBe('sse');
    // The bound session stream IS the (synthetic) subscription now.
    const sub = await client.subscribe({ target: 'session', id: 'a' });
    expect(sub.subject).toBe('session:a/events');
    // Any OTHER subject still requires the WS transport.
    await expect(client.subscribe({ target: 'session', id: 'other' })).rejects.toBeInstanceOf(
      TransportFailedError,
    );
    await client.disconnect();
  });

  it('SSE connect without a sessionId fails with an actionable error (IP-3)', async () => {
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'bearer', token: 't' },
      transport: 'sse',
      fetch: sseFetchStub(),
    });
    await expect(client.connect()).rejects.toThrow(/sessionId/);
  });

  it('rejects connect with TransportFailedError when SSE is requested but auth is ticket', async () => {
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'ticket', ticketProvider: async () => 't' },
      transport: 'sse',
      EventSource: FAKE_ES,
    });
    await expect(client.connect()).rejects.toBeInstanceOf(TransportFailedError);
  });

  it('connect() is idempotent + ignores a second connect while connecting', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    const promise1 = client.connect();
    const promise2 = client.connect();
    await ackInitialize();
    await Promise.all([promise1, promise2]);
    // Already-connected → no-op.
    await client.connect();
    await client.disconnect();
  });

  it('throws when subscribe is called without a successful connect', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await expect(client.subscribe({ target: 'session', id: 'a' })).rejects.toBeInstanceOf(
      ClientNotConnectedError,
    );
  });

  it('cancelNotify throws when not connected; rejects empty requestId via TypeError', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    expect(() => client.cancelNotify('req-1')).toThrow(ClientNotConnectedError);
    const promise = client.connect();
    await ackInitialize();
    await promise;
    expect(() => client.cancelNotify('')).toThrow(TypeError);
    await client.disconnect();
  });

  it('subject builder validates non-empty fields', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    const promise = client.connect();
    await ackInitialize();
    await promise;
    await expect(client.subscribe({ target: 'session', id: '' })).rejects.toBeInstanceOf(TypeError);
    await client.disconnect();
  });

  it('falls back to SSE on auto-mode when the WebSocket implementation is unavailable', async () => {
    const capture: { headers?: Record<string, string>; url?: string } = {};
    const client = new GraphorinClient({
      baseUrl: 'http://x',
      auth: { kind: 'bearer', token: 't' },
      transport: 'auto',
      sessionId: 'sess-fb',
      // No WebSocket impl supplied → openWebSocketTransport throws,
      // and the auto-mode resolver should fall through to SSE.
      fetch: sseFetchStub(capture),
    });
    const original = globalThis.WebSocket;
    (globalThis as { WebSocket?: unknown }).WebSocket = undefined;
    try {
      await client.connect();
      expect(client.transportKind).toBe('sse');
      // fetch carries the Authorization header natively (IP-3) and the
      // session is substituted into the path (no literal ':sessionId').
      expect(capture.headers?.Authorization).toBe('Bearer t');
      expect(capture.url).toContain('/v1/sessions/sess-fb/events');
      expect(capture.url).not.toContain(':sessionId');
      await client.disconnect();
    } finally {
      (globalThis as { WebSocket?: unknown }).WebSocket = original;
    }
  });

  it('terminates the iterator and removes the subscription when an error frame targets it', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    const promise = client.connect();
    await ackInitialize();
    await promise;
    const socket = lastSocket();

    const subPromise = client.subscribe({ target: 'session', id: 'abc' });
    await Promise.resolve();
    const sent = JSON.parse(socket.sent.at(-1) ?? '{}') as { id: string };
    socket.fireMessage({
      v: '1',
      jsonrpc: '2.0',
      id: sent.id,
      result: { subscriptionId: 'sub-err' },
    });
    const sub = await subPromise;

    socket.fireMessage({
      v: '1',
      kind: 'error',
      code: 'rate.limited',
      message: 'too fast',
      subscriptionId: 'sub-err',
    });

    const collected: unknown[] = [];
    let caught: unknown;
    try {
      for await (const event of sub.events()) {
        collected.push(event);
      }
    } catch (err) {
      caught = err;
    }
    expect(collected).toHaveLength(0);
    expect((caught as Error | undefined)?.message ?? '').toContain('rate.limited');
    expect(sub.metadata().closed).toBe(true);
    await client.disconnect();
  });

  it('unsubscribes via subscription.unsubscribe and tears the iterator down', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    const promise = client.connect();
    await ackInitialize();
    await promise;
    const socket = lastSocket();

    const subPromise = client.subscribe({ target: 'session', id: 'abc' });
    await Promise.resolve();
    const sent = JSON.parse(socket.sent.at(-1) ?? '{}') as { id: string };
    socket.fireMessage({
      v: '1',
      jsonrpc: '2.0',
      id: sent.id,
      result: { subscriptionId: 'sub-u' },
    });
    const sub = await subPromise;

    const unsubPromise = sub.unsubscribe();
    await Promise.resolve();
    const unsubFrame = JSON.parse(socket.sent.at(-1) ?? '{}') as { id: string };
    socket.fireMessage({
      v: '1',
      jsonrpc: '2.0',
      id: unsubFrame.id,
      result: { unsubscribed: true },
    });
    await unsubPromise;
    expect(sub.metadata().closed).toBe(true);
    await client.disconnect();
  });
});
