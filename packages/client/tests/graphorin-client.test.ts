import type { ServerMessage } from '@graphorin/protocol';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ClientNotConnectedError,
  GraphorinClientError,
  SubprotocolMismatchError,
} from '../src/errors.js';
import { GraphorinClient } from '../src/graphorin-client.js';
import {
  configureNextSocket,
  lastSocket,
  MockWebSocket,
  resetMockTransport,
} from './__fixtures__/mock-websocket.js';

beforeEach(() => {
  resetMockTransport();
});

afterEach(() => {
  resetMockTransport();
});

const FAKE_WS = MockWebSocket as unknown as typeof WebSocket;

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
        result: {
          serverInfo: { name: 'graphorin-server', version: '0.1.0' },
          capabilities: {},
        },
      });
      return;
    }
  }
  throw new Error('No initialize frame seen within 50 microtasks.');
}

async function connectAndAck(client: GraphorinClient): Promise<void> {
  const promise = client.connect();
  await ackInitialize();
  await promise;
}

describe('GraphorinClient — constructor + connect', () => {
  it('rejects an empty baseUrl at construction', () => {
    expect(
      () =>
        new GraphorinClient({
          baseUrl: '',
          auth: { kind: 'bearer', token: 't' },
          WebSocket: FAKE_WS,
        }),
    ).toThrow(TypeError);
  });

  it('opens a WebSocket against the configured base URL', async () => {
    const client = new GraphorinClient({
      baseUrl: 'http://localhost:8080',
      auth: { kind: 'bearer', token: 'tok' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    expect(client.transportKind).toBe('ws');
    expect(lastSocket().url).toBe('ws://localhost:8080/v1/ws');
    await client.disconnect();
  });

  it('attaches the ticket as a Sec-WebSocket-Protocol token when using ticket auth', async () => {
    const client = new GraphorinClient({
      baseUrl: 'wss://example.com',
      auth: {
        kind: 'ticket',
        ticketProvider: async () => 'ticket-abc',
      },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    expect(lastSocket().subprotocols).toEqual(['graphorin.protocol.v1', 'ticket.ticket-abc']);
    await client.disconnect();
  });

  it('rejects when the server selects a non-matching subprotocol', async () => {
    configureNextSocket({ negotiatedProtocol: 'mqtt' });
    const client = new GraphorinClient({
      baseUrl: 'ws://localhost',
      auth: { kind: 'bearer', token: 't' },
      transport: 'ws',
      WebSocket: FAKE_WS,
    });
    await expect(client.connect()).rejects.toBeInstanceOf(SubprotocolMismatchError);
  });
});

describe('GraphorinClient — RPC + subscriptions', () => {
  it('correlates subscribe RPC with the matching reply and pushes events to the iterator', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://localhost',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    const socket = lastSocket();
    const sentBefore = socket.sent.length;
    const subPromise = client.subscribe({ target: 'session', id: 'abc' });
    await Promise.resolve();
    expect(socket.sent.length).toBe(sentBefore + 1);
    const sentFrame = JSON.parse(socket.sent.at(-1) ?? '{}') as {
      id: string;
      method: string;
      params: { subject: string };
    };
    expect(sentFrame.method).toBe('subscription.subscribe');
    expect(sentFrame.params.subject).toBe('session:abc/events');

    const reply: ServerMessage = {
      v: '1',
      jsonrpc: '2.0',
      id: sentFrame.id,
      result: { subscriptionId: 'sub-xyz', snapshotEventId: 'evt-0' },
    };
    socket.fireMessage(reply);
    const sub = await subPromise;
    expect(sub.subscriptionId).toBe('sub-xyz');
    expect(sub.subject).toBe('session:abc/events');

    const event1: ServerMessage = {
      v: '1',
      kind: 'event',
      eventId: 'evt-1',
      subscriptionId: 'sub-xyz',
      subject: 'session:abc/events',
      type: 'text.delta',
      payload: { delta: 'Hello' },
    };
    const event2: ServerMessage = {
      v: '1',
      kind: 'event',
      eventId: 'evt-2',
      subscriptionId: 'sub-xyz',
      subject: 'session:abc/events',
      type: 'text.delta',
      payload: { delta: ', world' },
    };
    socket.fireMessage(event1);
    socket.fireMessage(event2);

    const events: string[] = [];
    const iter = sub.events()[Symbol.asyncIterator]();
    const first = await iter.next();
    expect(first.done).toBe(false);
    if (!first.done) events.push((first.value.payload as { delta: string }).delta);
    const second = await iter.next();
    if (!second.done) events.push((second.value.payload as { delta: string }).delta);
    expect(events).toEqual(['Hello', ', world']);
    expect(sub.metadata().lastEventId).toBe('evt-2');

    await client.disconnect();
  });

  it('surfaces an RPC error frame as GraphorinClientError', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://localhost',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    const socket = lastSocket();
    const sub = client.subscribe({ target: 'session', id: 'denied' });
    await Promise.resolve();
    const sent = JSON.parse(socket.sent.at(-1) ?? '{}') as { id: string };
    socket.fireMessage({
      v: '1',
      jsonrpc: '2.0',
      id: sent.id,
      error: { code: -32003, message: 'scope denied' },
    });
    await expect(sub).rejects.toBeInstanceOf(GraphorinClientError);
    await client.disconnect();
  });

  it('rejects subscribe when not connected', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await expect(client.ping()).rejects.toBeInstanceOf(ClientNotConnectedError);
  });

  it('terminates the iterator when a lifecycle frame reports completion', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    const socket = lastSocket();
    const subPromise = client.subscribe({
      target: 'agent',
      id: 'echo',
      runId: 'run-1',
    });
    await Promise.resolve();
    const sent = JSON.parse(socket.sent.at(-1) ?? '{}') as { id: string };
    socket.fireMessage({
      v: '1',
      jsonrpc: '2.0',
      id: sent.id,
      result: { subscriptionId: 'sub-l' },
    });
    const sub = await subPromise;
    socket.fireMessage({
      v: '1',
      kind: 'event',
      eventId: 'e-1',
      subscriptionId: 'sub-l',
      subject: sub.subject,
      type: 'text.delta',
      payload: { delta: 'ok' },
    });
    socket.fireMessage({
      v: '1',
      kind: 'lifecycle',
      subscriptionId: 'sub-l',
      status: 'completed',
    });
    const collected: unknown[] = [];
    for await (const event of sub.events()) {
      collected.push(event);
    }
    expect(collected.length).toBe(1);
    await client.disconnect();
  });

  it('cancels a run via the cancel RPC and resolves with the server reply', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    const socket = lastSocket();
    const cancelPromise = client.cancel('run-1', { drain: false });
    await Promise.resolve();
    const sent = JSON.parse(socket.sent.at(-1) ?? '{}') as {
      id: string;
      method: string;
      params: { runId: string };
    };
    expect(sent.method).toBe('run.cancel');
    expect(sent.params.runId).toBe('run-1');
    socket.fireMessage({
      v: '1',
      jsonrpc: '2.0',
      id: sent.id,
      result: { cancelled: true },
    });
    const reply = (await cancelPromise) as { cancelled?: boolean };
    expect(reply.cancelled).toBe(true);
    await client.disconnect();
  });

  it('rejects cancel with a TypeError when runId is empty', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    await expect(client.cancel('')).rejects.toBeInstanceOf(TypeError);
    await client.disconnect();
  });

  it('sends an MCP-compatible cancel notification without an id', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    const socket = lastSocket();
    client.cancelNotify('req-7');
    const last = JSON.parse(socket.sent.at(-1) ?? '{}') as {
      method: string;
      params: { requestId: string };
      id?: unknown;
    };
    expect(last.method).toBe('notifications/cancelled');
    expect(last.params.requestId).toBe('req-7');
    expect(last.id).toBeUndefined();
    await client.disconnect();
  });

  it('disconnect rejects pending RPCs and is idempotent', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    const cancelPromise = client.cancel('run-1');
    const disconnectPromise = client.disconnect();
    await expect(cancelPromise).rejects.toBeInstanceOf(GraphorinClientError);
    await disconnectPromise;
    // Second disconnect is a no-op.
    await client.disconnect();
  });

  it('builds the correct subject for every target shape', async () => {
    const client = new GraphorinClient({
      baseUrl: 'ws://x',
      auth: { kind: 'bearer', token: 't' },
      WebSocket: FAKE_WS,
    });
    await connectAndAck(client);
    const socket = lastSocket();
    const cases = [
      [{ target: 'session', id: 'abc' } as const, 'session:abc/events'],
      [{ target: 'agent', id: 'a', runId: 'r' } as const, 'agent:a/runs/r/events'],
      [{ target: 'workflow', id: 'w' } as const, 'workflow:w/events'],
      [{ target: 'run', runId: 'r' } as const, 'run:r/events'],
      [{ target: 'run', runId: 'r', sessionId: 's' } as const, 'session:s/runs/r/events'],
    ];
    for (const [target, expected] of cases) {
      void client.subscribe(target).catch(() => undefined);
      await Promise.resolve();
      const sent = JSON.parse(socket.sent.at(-1) ?? '{}') as {
        params: { subject: string };
      };
      expect(sent.params.subject).toBe(expected);
    }
    await client.disconnect();
  });
});
