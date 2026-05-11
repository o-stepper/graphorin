import type { ServerEventFrame, ServerMessage } from '@graphorin/protocol';
import { parseScope } from '@graphorin/security/auth';
import { describe, expect, it } from 'vitest';

import { createWsDispatcher } from '../src/ws/dispatcher.js';

function makeSubscriber(id: string, scopes: string[]) {
  const sent: ServerMessage[] = [];
  return {
    handle: {
      id,
      tokenId: `tok-${id}`,
      grantedScopes: scopes.map((s) => parseScope(s)),
      send: (frame: ServerMessage) => {
        sent.push(frame);
      },
      close: () => {},
    },
    sent,
  };
}

describe('WsDispatcher replay resume on reconnect', () => {
  it('replays buffered events to a brand-new subscription with no cursor', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber('s1', ['agents:invoke:*']);
    dispatcher.registerSubscriber(sub.handle);

    // Emit events before any subscription exists.
    for (let i = 0; i < 5; i += 1) {
      dispatcher.emit('session:abc/events', {
        type: 'text.delta',
        payload: { delta: `chunk-${i}` },
      });
    }

    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.replayedCount).toBe(5);
    const replayedDeltas = sub.sent
      .filter((frame): frame is ServerEventFrame => 'kind' in frame && frame.kind === 'event')
      .map((frame) => (frame.payload as { delta: string }).delta);
    expect(replayedDeltas).toEqual(['chunk-0', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4']);
  });

  it('resumes from a sinceEventId cursor and only replays events after the cursor', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber('s1', ['agents:invoke:*']);
    dispatcher.registerSubscriber(sub.handle);

    // Pre-emit + capture the eventId of the third frame.
    let cursor: string | undefined;
    for (let i = 0; i < 5; i += 1) {
      const beforeSize = dispatcher.replayBuffer.size('session:abc/events');
      dispatcher.emit('session:abc/events', {
        type: 'text.delta',
        payload: { delta: `chunk-${i}` },
      });
      if (i === 2) {
        const slice = dispatcher.replayBuffer.replay('session:abc/events', undefined);
        cursor = slice.events[beforeSize]?.eventId;
      }
    }
    expect(cursor).toBeDefined();

    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
      ...(cursor !== undefined ? { sinceEventId: cursor } : {}),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.replayedCount).toBe(2);
    const replayed = sub.sent
      .filter((frame): frame is ServerEventFrame => 'kind' in frame && frame.kind === 'event')
      .map((frame) => (frame.payload as { delta: string }).delta);
    expect(replayed).toEqual(['chunk-3', 'chunk-4']);
  });

  it('emits a replay-marker when the cursor predates the buffer cutoff', () => {
    const dispatcher = createWsDispatcher({
      replayBuffer: { maxEvents: 2 },
    });
    const sub = makeSubscriber('s1', ['agents:invoke:*']);
    dispatcher.registerSubscriber(sub.handle);

    // Push 5 events; the buffer drops the first 3.
    for (let i = 0; i < 5; i += 1) {
      dispatcher.emit('session:abc/events', {
        type: 'text.delta',
        payload: { delta: `chunk-${i}` },
      });
    }

    dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
      sinceEventId: 'evt-not-in-buffer',
    });
    const marker = sub.sent.find((frame) => 'kind' in frame && frame.kind === 'replay-marker');
    expect(marker).toBeDefined();
  });
});
