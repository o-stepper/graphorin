/**
 * IP-3: wire-format parity for the fetch-streaming SSE transport. The
 * fixture replays the EXACT bytes `@graphorin/server`'s `encodeSse`
 * writes (named `event:` lines + the full frame JSON in `data:` +
 * `id:`), which is precisely the format the old `EventSource`
 * `message`-only listener never received.
 */

import type { ServerMessage } from '@graphorin/protocol';
import { describe, expect, it } from 'vitest';

import { TransportFailedError } from '../src/errors.js';
import { openSseTransport } from '../src/transport/sse.js';

/** Byte-identical twin of server/sse/events.ts `encodeSse`. */
function encodeSse(frame: { event?: string; id?: string; data: string }): string {
  let out = '';
  if (frame.event !== undefined) out += `event: ${frame.event}\n`;
  if (frame.id !== undefined) out += `id: ${frame.id}\n`;
  for (const line of frame.data.split('\n')) {
    out += `data: ${line}\n`;
  }
  return `${out}\n`;
}

function eventFrame(type: string, eventId: string, payload: unknown): string {
  return encodeSse({
    event: type, // the server names every event - the IP-3 break
    id: eventId,
    data: JSON.stringify({
      v: '1',
      kind: 'event',
      subscriptionId: 'sse-srv-sub',
      subject: 'session:sess-1/events',
      eventId,
      type,
      payload,
    }),
  });
}

function streamResponse(chunks: ReadonlyArray<string>): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const c of chunks) {
        controller.enqueue(enc.encode(c));
        await new Promise((r) => setTimeout(r, 5));
      }
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('openSseTransport - server wire-format parity (IP-3)', () => {
  it('delivers NAMED server events (the message-only listener saw none) + tracks lastEventId', async () => {
    const captured: { headers?: Record<string, string> } = {};
    const fetchImpl = (async (_url: unknown, init?: RequestInit) => {
      captured.headers = Object.fromEntries(
        Object.entries((init?.headers ?? {}) as Record<string, string>),
      );
      return streamResponse([
        ': keep-alive comment\n\n',
        eventFrame('text.delta', 'evt-1', { delta: 'hel' }),
        eventFrame('text.delta', 'evt-2', { delta: 'lo' }),
        encodeSse({
          event: 'lifecycle',
          data: JSON.stringify({
            v: '1',
            kind: 'lifecycle',
            subscriptionId: 'sse-srv-sub',
            status: 'completed',
          }),
        }),
      ]);
    }) as typeof fetch;

    const frames: ServerMessage[] = [];
    const closes: unknown[] = [];
    const transport = await openSseTransport(
      {
        url: 'http://local.test/v1/sessions/sess-1/events',
        auth: { kind: 'bearer', token: 'tok-123' },
        fetch: fetchImpl,
      },
      {
        onOpen: () => {},
        onFrame: (f) => {
          frames.push(f);
        },
        onError: () => {},
        onClose: (r) => {
          closes.push(r);
        },
      },
    );
    await new Promise((r) => setTimeout(r, 80));

    // fetch carries the Authorization header natively (EventSource
    // could not without a polyfill).
    expect(captured.headers?.Authorization).toBe('Bearer tok-123');
    const types = frames.map((f) => (f as { type?: string; kind?: string }).type);
    expect(types.filter((t) => t === 'text.delta')).toHaveLength(2);
    expect(frames.some((f) => (f as { kind?: string }).kind === 'lifecycle')).toBe(true);
    expect(transport.lastEventId).toBe('evt-2');
    expect(closes.length).toBeGreaterThan(0); // stream end closes cleanly
  });

  it('sends Last-Event-ID on connect when a resume cursor is supplied (periphery-03)', async () => {
    const captured: { headers?: Record<string, string> } = {};
    const fetchImpl = (async (_url: unknown, init?: RequestInit) => {
      captured.headers = Object.fromEntries(
        Object.entries((init?.headers ?? {}) as Record<string, string>),
      );
      return streamResponse([eventFrame('text.delta', 'evt-9', { delta: 'x' })]);
    }) as typeof fetch;
    await openSseTransport(
      {
        url: 'http://local.test/v1/sessions/sess-1/events',
        auth: { kind: 'bearer', token: 'tok-123' },
        fetch: fetchImpl,
        lastEventId: 'evt-42',
      },
      { onOpen: () => {}, onFrame: () => {}, onError: () => {}, onClose: () => {} },
    );
    // Pre-fix the header was never sent, so every reconnect replayed
    // the ENTIRE server buffer into the consumer.
    expect(captured.headers?.['Last-Event-ID']).toBe('evt-42');
  });

  it('multi-line data frames reassemble before parsing', async () => {
    const pretty = JSON.stringify(
      {
        v: '1',
        kind: 'event',
        subscriptionId: 's',
        subject: 'session:s/events',
        eventId: 'evt-9',
        type: 'big',
        payload: {},
      },
      null,
      2,
    );
    const fetchImpl = (async () =>
      streamResponse([encodeSse({ event: 'big', id: 'evt-9', data: pretty })])) as typeof fetch;
    const frames: ServerMessage[] = [];
    await openSseTransport(
      {
        url: 'http://x/v1/sessions/s/events',
        auth: { kind: 'bearer', token: 't' },
        fetch: fetchImpl,
      },
      { onOpen: () => {}, onFrame: (f) => frames.push(f), onError: () => {}, onClose: () => {} },
    );
    await new Promise((r) => setTimeout(r, 40));
    expect((frames[0] as { eventId?: string })?.eventId).toBe('evt-9');
  });

  it('send() stays a typed rejection (read-only transport)', async () => {
    const fetchImpl = (async () => streamResponse([])) as typeof fetch;
    const transport = await openSseTransport(
      {
        url: 'http://x/v1/sessions/s/events',
        auth: { kind: 'bearer', token: 't' },
        fetch: fetchImpl,
      },
      { onOpen: () => {}, onFrame: () => {}, onError: () => {}, onClose: () => {} },
    );
    expect(() => transport.send({} as never)).toThrow(TransportFailedError);
    transport.close();
  });

  it('rejects a non-bearer auth strategy', async () => {
    await expect(
      openSseTransport(
        {
          url: 'http://x/v1/sessions/s/events',
          auth: { kind: 'ticket-provider', getTicket: async () => 't' } as never,
        },
        { onOpen: () => {}, onFrame: () => {}, onError: () => {}, onClose: () => {} },
      ),
    ).rejects.toThrow(/bearer/);
  });

  it('a non-2xx answer rejects with a typed transport error', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(
      openSseTransport(
        {
          url: 'http://x/v1/sessions/s/events',
          auth: { kind: 'bearer', token: 't' },
          fetch: fetchImpl,
        },
        { onOpen: () => {}, onFrame: () => {}, onError: () => {}, onClose: () => {} },
      ),
    ).rejects.toThrow(/503/);
  });
});
