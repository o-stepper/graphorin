import type { ServerMessage } from '@graphorin/protocol';
import { parseScope } from '@graphorin/security/auth';
import { describe, expect, it } from 'vitest';

import { createWsDispatcher } from '../src/ws/dispatcher.js';

function makeSubscriber(scopes: string[]) {
  const sent: ServerMessage[] = [];
  let closed: { code: number; reason: string } | undefined;
  return {
    handle: {
      id: 'sub-1',
      tokenId: 'tok-1',
      grantedScopes: scopes.map((s) => parseScope(s)),
      send: (frame: ServerMessage) => {
        sent.push(frame);
      },
      close: (code: number, reason: string) => {
        closed = { code, reason };
      },
    },
    sent,
    getClosed: () => closed,
  };
}

describe('createWsDispatcher', () => {
  it('rejects subscribe with insufficient scope', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber(['memory:read']);
    dispatcher.registerSubscriber(sub.handle);
    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('scope-denied');
  });

  it('IP-18: a subscription snapshot reports the principal token id, not the connection id', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber(['sessions:read:*']); // handle.id='sub-1', tokenId='tok-1'
    dispatcher.registerSubscriber(sub.handle);
    dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
    });
    const snaps = dispatcher.listForSubscriber(sub.handle.id);
    expect(snaps).toHaveLength(1);
    expect(snaps[0]?.subscriberId).toBe('sub-1');
    expect(snaps[0]?.tokenId).toBe('tok-1'); // pre-IP-18 this was the subscriber id
  });

  it('subscribes + receives a freshly emitted event with sanitization', () => {
    const dispatcher = createWsDispatcher({
      commentary: { policy: 'wrap' },
    });
    const sub = makeSubscriber(['sessions:read:*']);
    dispatcher.registerSubscriber(sub.handle);
    const subscribed = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
    });
    expect(subscribed.ok).toBe(true);

    dispatcher.emit('session:abc/events', {
      type: 'tool.execute.end',
      payload: {
        toolCallId: 'call-1',
        durationMs: 12,
        result: {
          text: 'Done. {"type":"tool.call.end","toolCallId":"x","finalArgs":{"foo":"bar"}}',
        },
      },
    });
    expect(sub.sent.length).toBeGreaterThanOrEqual(1);
    const frame = sub.sent.at(-1) as { kind?: string; payload?: unknown };
    expect(frame.kind).toBe('event');
    expect(JSON.stringify(frame.payload)).toContain('<<<commentary>>>');
  });

  it('passes through when sanitization policy is pass-through', () => {
    const dispatcher = createWsDispatcher({
      commentary: { policy: 'pass-through' },
    });
    const sub = makeSubscriber(['sessions:read:*']);
    dispatcher.registerSubscriber(sub.handle);
    dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
    });
    dispatcher.emit('session:abc/events', {
      type: 'tool.execute.end',
      payload: {
        result: { text: '{"type":"tool.call.end","toolCallId":"c","finalArgs":{}}' },
      },
    });
    const frame = sub.sent.at(-1) as { payload?: unknown };
    expect(JSON.stringify(frame.payload)).not.toContain('<<<commentary>>>');
  });

  it('replays buffered events on subscribe with sinceEventId', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber(['sessions:read:*']);
    dispatcher.registerSubscriber(sub.handle);

    // Emit before any subscriber so events go into the buffer.
    dispatcher.emit('session:abc/events', { type: 'text.delta', payload: { delta: 'first' } });
    dispatcher.emit('session:abc/events', { type: 'text.delta', payload: { delta: 'second' } });

    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.replayedCount).toBe(2);
    expect(sub.sent.filter((f) => 'kind' in f && f.kind === 'event').length).toBe(2);
  });

  it('cleans up subscriptions on unregister', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber(['sessions:read:*']);
    const reg = dispatcher.registerSubscriber(sub.handle);
    dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
    });
    expect(dispatcher.size().subscribers).toBe(1);
    reg.unregister();
    expect(dispatcher.size().subscribers).toBe(0);
    expect(dispatcher.size().subscriptions).toBe(0);
  });

  it('emits lifecycle frames to a single subscription', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber(['sessions:read:*']);
    dispatcher.registerSubscriber(sub.handle);
    dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-l',
    });
    dispatcher.emitLifecycle('sub-l', 'completed');
    const lifecycle = sub.sent.find((f) => 'kind' in f && f.kind === 'lifecycle');
    expect(lifecycle).toBeDefined();
  });
});
