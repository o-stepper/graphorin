import type { ServerMessage } from '@graphorin/protocol';
import { parseScope } from '@graphorin/security/auth';
import { describe, expect, it } from 'vitest';

import { createWsDispatcher } from '../src/ws/dispatcher.js';

interface RecordingSubscriber {
  readonly id: string;
  readonly tokenId: string;
  readonly grantedScopes: ReturnType<typeof parseScope>[];
  readonly received: ServerMessage[];
  closeArgs: { code: number; reason: string } | undefined;
  send(frame: ServerMessage): void;
  close(code: number, reason: string): void;
  bufferedAmount?(): number;
}

function makeSubscriber(id: string, scopes: string[]): RecordingSubscriber {
  return {
    id,
    tokenId: `tok-${id}`,
    grantedScopes: scopes.map((s) => parseScope(s)),
    received: [],
    closeArgs: undefined,
    send(frame: ServerMessage) {
      this.received.push(frame);
    },
    close(code: number, reason: string) {
      this.closeArgs = { code, reason };
    },
  };
}

describe('WsDispatcher backpressure', () => {
  it('closes the subscriber with 4006 flow.throttled when bufferedAmount exceeds the configured budget', () => {
    const dispatcher = createWsDispatcher({
      perConnectionQueueLimit: 4,
      onWarn: () => {},
    });
    const sub = makeSubscriber('s1', ['agents:invoke:*']);
    sub.bufferedAmount = () => 1024 * 5; // > limit * 1024
    dispatcher.registerSubscriber(sub);
    dispatcher.subscribe({
      subscriberId: sub.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-1',
    });
    dispatcher.emit('session:abc/events', { type: 'text.delta', payload: { delta: 'x' } });
    expect(sub.closeArgs?.code).toBe(4006);
    expect(sub.closeArgs?.reason).toBe('flow.throttled');
    // Subsequent emits should not crash even though the subscriber is gone.
    dispatcher.emit('session:abc/events', { type: 'text.delta', payload: { delta: 'y' } });
    expect(dispatcher.size().subscribers).toBe(0);
  });

  it('forwards send errors as a 4006 close + warn signal', () => {
    const dispatcher = createWsDispatcher({
      perConnectionQueueLimit: 100,
      onWarn: () => {},
    });
    const sub = makeSubscriber('s1', ['agents:invoke:*']);
    sub.send = () => {
      throw new Error('socket-write-failed');
    };
    dispatcher.registerSubscriber(sub);
    dispatcher.subscribe({
      subscriberId: sub.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-1',
    });
    dispatcher.emit('session:abc/events', { type: 'text.delta', payload: { delta: 'x' } });
    expect(sub.closeArgs?.code).toBe(4006);
  });
});
