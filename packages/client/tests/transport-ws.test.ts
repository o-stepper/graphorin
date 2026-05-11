/**
 * Direct unit tests for `openWebSocketTransport` covering the
 * lifecycle paths the higher-level `GraphorinClient` doesn't always
 * exercise (server-side error frame on the wire, transport close
 * with a Graphorin reason, malformed JSON rejection).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AuthFailedError, TransportFailedError } from '../src/errors.js';
import { openWebSocketTransport } from '../src/transport/ws.js';
import {
  configureNextSocket,
  lastSocket,
  MockWebSocket,
  resetMockTransport,
} from './__fixtures__/mock-websocket.js';

beforeEach(() => resetMockTransport());
afterEach(() => resetMockTransport());

const FAKE_WS = MockWebSocket as unknown as typeof WebSocket;

describe('openWebSocketTransport', () => {
  it('throws when no WebSocket implementation is available', async () => {
    await expect(
      openWebSocketTransport(
        {
          url: 'ws://x',
          auth: { kind: 'bearer', token: 't' },
          // @ts-expect-error — exercising the runtime guard
          WebSocket: undefined,
        },
        {
          onOpen: () => {},
          onFrame: () => {},
          onError: () => {},
          onClose: () => {},
        },
      ),
    ).rejects.toBeInstanceOf(TransportFailedError);
  });

  it('reports a fatal auth.* error frame as AuthFailedError via onError', async () => {
    const errors: Error[] = [];
    const transport = await openWebSocketTransport(
      {
        url: 'ws://x',
        auth: { kind: 'bearer', token: 't' },
        WebSocket: FAKE_WS,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: (err) => errors.push(err),
        onClose: () => {},
      },
    );
    lastSocket().fireMessage(
      JSON.stringify({
        v: '1',
        kind: 'error',
        code: 'auth.scope_denied',
        message: 'denied',
        fatal: true,
      }),
    );
    expect(errors.find((e) => e instanceof AuthFailedError)).toBeDefined();
    transport.close();
  });

  it('rejects malformed JSON via onError after open', async () => {
    const errors: Error[] = [];
    const transport = await openWebSocketTransport(
      {
        url: 'ws://x',
        auth: { kind: 'bearer', token: 't' },
        WebSocket: FAKE_WS,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: (err) => errors.push(err),
        onClose: () => {},
      },
    );
    lastSocket().fireMessage('not-json');
    expect(errors).toHaveLength(1);
    transport.close();
  });

  it('rejects schema-invalid frames via onError after open', async () => {
    const errors: Error[] = [];
    const transport = await openWebSocketTransport(
      {
        url: 'ws://x',
        auth: { kind: 'bearer', token: 't' },
        WebSocket: FAKE_WS,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: (err) => errors.push(err),
        onClose: () => {},
      },
    );
    lastSocket().fireMessage(JSON.stringify({ kind: 'unknown' }));
    expect(errors).toHaveLength(1);
    transport.close();
  });

  it('forwards onClose with the Graphorin reason discriminator on a graceful server close', async () => {
    const closes: { code: number; graphorinReason?: string }[] = [];
    const transport = await openWebSocketTransport(
      {
        url: 'ws://x',
        auth: { kind: 'bearer', token: 't' },
        WebSocket: FAKE_WS,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: () => {},
        onClose: (reason) =>
          closes.push({
            code: reason.code,
            ...(reason.graphorinReason !== undefined
              ? { graphorinReason: reason.graphorinReason }
              : {}),
          }),
      },
    );
    lastSocket().fireServerClose(4007, 'server.shutdown');
    expect(closes[0]?.code).toBe(4007);
    expect(closes[0]?.graphorinReason).toBe('server.shutdown');
    void transport;
  });

  it('rejects construction failure with TransportFailedError', async () => {
    class ThrowingCtor {
      constructor() {
        throw new Error('boom');
      }
    }
    await expect(
      openWebSocketTransport(
        {
          url: 'ws://x',
          auth: { kind: 'bearer', token: 't' },
          WebSocket: ThrowingCtor as unknown as typeof WebSocket,
        },
        {
          onOpen: () => {},
          onFrame: () => {},
          onError: () => {},
          onClose: () => {},
        },
      ),
    ).rejects.toBeInstanceOf(TransportFailedError);
  });

  it('throws TransportFailedError on send when the socket is not OPEN', async () => {
    const transport = await openWebSocketTransport(
      {
        url: 'ws://x',
        auth: { kind: 'bearer', token: 't' },
        WebSocket: FAKE_WS,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: () => {},
        onClose: () => {},
      },
    );
    transport.close();
    expect(() =>
      transport.send({
        v: '1',
        jsonrpc: '2.0',
        id: 1,
        method: 'ping',
      }),
    ).toThrow(TransportFailedError);
  });

  it('treats a pre-open auth.* close code as AuthFailedError on connect', async () => {
    configureNextSocket({ manualOpen: true });
    const promise = openWebSocketTransport(
      {
        url: 'ws://x',
        auth: { kind: 'bearer', token: 't' },
        WebSocket: FAKE_WS,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: () => {},
        onClose: () => {},
      },
    );
    queueMicrotask(() => lastSocket().fireServerClose(4002, 'auth.invalid'));
    await expect(promise).rejects.toBeInstanceOf(AuthFailedError);
  });
});
