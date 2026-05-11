import type { ServerMessage } from '@graphorin/protocol';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TransportFailedError } from '../src/errors.js';
import { openSseTransport } from '../src/transport/sse.js';
import {
  lastEventSource,
  MockEventSource,
  resetMockEventSource,
} from './__fixtures__/mock-event-source.js';

beforeEach(() => resetMockEventSource());
afterEach(() => resetMockEventSource());

const FAKE_ES = MockEventSource as unknown as typeof EventSource;

describe('openSseTransport', () => {
  it('opens an EventSource against the configured URL', async () => {
    const transport = await openSseTransport(
      {
        url: 'http://localhost/v1/sessions/abc/events',
        auth: { kind: 'bearer', token: 'tok' },
        EventSource: FAKE_ES,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: () => {},
        onClose: () => {},
      },
    );
    expect(transport.kind).toBe('sse');
    expect(transport.url).toBe('http://localhost/v1/sessions/abc/events');
    expect(lastEventSource().init.headers?.Authorization).toBe('Bearer tok');
    transport.close();
  });

  it('rejects when the auth strategy is ticket', async () => {
    await expect(
      openSseTransport(
        {
          url: 'http://localhost',
          auth: { kind: 'ticket', ticketProvider: async () => 't' },
          EventSource: FAKE_ES,
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

  it('forwards parsed event frames to onFrame', async () => {
    const frames: ServerMessage[] = [];
    const transport = await openSseTransport(
      {
        url: 'http://localhost',
        auth: { kind: 'bearer', token: 'tok' },
        EventSource: FAKE_ES,
      },
      {
        onOpen: () => {},
        onFrame: (frame) => frames.push(frame),
        onError: () => {},
        onClose: () => {},
      },
    );
    const source = lastEventSource();
    source.fireMessage(
      JSON.stringify({
        v: '1',
        kind: 'event',
        eventId: 'evt-1',
        subscriptionId: 'sub-1',
        subject: 'session:abc/events',
        type: 'text.delta',
        payload: { delta: 'ok' },
      }),
    );
    expect(frames).toHaveLength(1);
    expect(transport.lastEventId).toBe('evt-1');
    transport.close();
  });

  it('rejects send() with TransportFailedError', async () => {
    const transport = await openSseTransport(
      {
        url: 'http://localhost',
        auth: { kind: 'bearer', token: 'tok' },
        EventSource: FAKE_ES,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: () => {},
        onClose: () => {},
      },
    );
    expect(() =>
      transport.send({
        v: '1',
        jsonrpc: '2.0',
        method: 'ping',
        id: 1,
      }),
    ).toThrow(TransportFailedError);
    transport.close();
  });

  it('drops malformed JSON via onError after open', async () => {
    let errored: Error | undefined;
    const transport = await openSseTransport(
      {
        url: 'http://localhost',
        auth: { kind: 'bearer', token: 'tok' },
        EventSource: FAKE_ES,
      },
      {
        onOpen: () => {},
        onFrame: () => {},
        onError: (err) => {
          errored = err;
        },
        onClose: () => {},
      },
    );
    lastEventSource().fireMessage('not-json');
    expect(errored).toBeInstanceOf(Error);
    transport.close();
  });
});
