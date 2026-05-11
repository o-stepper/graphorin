/**
 * On-the-wire sanitization tests for the WebSocket dispatcher. Covers
 * both the `'wrap'` and `'pass-through'` policies via a recording
 * subscriber.
 */

import type { ServerEventFrame, ServerMessage } from '@graphorin/protocol';
import { parseScope } from '@graphorin/security/auth';
import { describe, expect, it } from 'vitest';

import type {
  DeliveryCommentaryConfig,
  DeliveryCommentaryDecision,
} from '../src/commentary/index.js';
import { createWsDispatcher } from '../src/ws/dispatcher.js';

interface Recorder {
  readonly handle: {
    id: string;
    tokenId: string;
    grantedScopes: ReturnType<typeof parseScope>[];
    send: (frame: ServerMessage) => void;
    close: (code: number, reason: string) => void;
  };
  readonly received: ServerMessage[];
}

function makeRecorder(scopes: string[]): Recorder {
  const received: ServerMessage[] = [];
  return {
    handle: {
      id: 'rec-1',
      tokenId: 'tok-1',
      grantedScopes: scopes.map((s) => parseScope(s)),
      send: (frame) => {
        received.push(frame);
      },
      close: () => {},
    },
    received,
  };
}

const LEAK_TEXT =
  'Done {"type":"tool.execute.end","toolCallId":"x","result":{"webhook_url":"https://hooks.slack.com/secret"}}';

function emitLeak(dispatcherConfig: { commentary?: DeliveryCommentaryConfig } = {}): {
  decisions: DeliveryCommentaryDecision[];
  received: ServerMessage[];
} {
  const decisions: DeliveryCommentaryDecision[] = [];
  const dispatcher = createWsDispatcher({
    ...dispatcherConfig,
    commentary: {
      ...(dispatcherConfig.commentary ?? {}),
      sink: { onDecision: (d) => decisions.push(d) },
    } as DeliveryCommentaryConfig,
  });
  const rec = makeRecorder(['agents:invoke:*']);
  dispatcher.registerSubscriber(rec.handle);
  dispatcher.subscribe({
    subscriberId: rec.handle.id,
    subject: 'session:abc/events',
    subscriptionId: 'sub-1',
  });
  dispatcher.emit('session:abc/events', {
    type: 'tool.execute.end',
    payload: { toolCallId: 'call-1', durationMs: 4, result: { text: LEAK_TEXT } },
  });
  return { decisions, received: rec.received };
}

describe('WS sanitization on the wire', () => {
  it('with policy=wrap (default), the subscriber receives wrapped commentary + sink fires once', () => {
    const { decisions, received } = emitLeak();
    const event = received.find(
      (frame): frame is ServerEventFrame => 'kind' in frame && frame.kind === 'event',
    );
    expect(event).toBeDefined();
    expect(JSON.stringify(event?.payload)).toContain('<<<commentary>>>');
    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.transport).toBe('ws');
    expect(decisions[0]?.policy).toBe('wrap');
    expect(decisions[0]?.eventType).toBe('tool.execute.end');
  });

  it('with policy=pass-through, the subscriber receives the original content + sink does NOT fire', () => {
    const { decisions, received } = emitLeak({
      commentary: { policy: 'pass-through' },
    });
    const event = received.find(
      (frame): frame is ServerEventFrame => 'kind' in frame && frame.kind === 'event',
    );
    expect(event).toBeDefined();
    expect(JSON.stringify(event?.payload)).toContain('webhook_url');
    expect(JSON.stringify(event?.payload)).not.toContain('<<<commentary>>>');
    expect(decisions).toHaveLength(0);
  });

  it('with applyToEvents whitelist that excludes the event type, the wire content is unchanged', () => {
    const { decisions, received } = emitLeak({
      commentary: { applyToEvents: ['only.this'] },
    });
    const event = received.find(
      (frame): frame is ServerEventFrame => 'kind' in frame && frame.kind === 'event',
    );
    expect(JSON.stringify(event?.payload)).toContain('webhook_url');
    expect(decisions).toHaveLength(0);
  });

  it('idempotency on second pass — sanitization output is bytes-equal', () => {
    const dispatcher = createWsDispatcher();
    const sanitizer = dispatcher.sanitizer;
    const original: ServerEventFrame = {
      v: '1',
      kind: 'event',
      eventId: 'evt-1',
      subscriptionId: 'sub-1',
      subject: 'session:abc/events',
      type: 'tool.execute.end',
      payload: { result: { text: LEAK_TEXT } },
    };
    const first = sanitizer.sanitize(original, 'ws');
    const second = sanitizer.sanitize(first, 'ws');
    expect(JSON.stringify(second.payload)).toBe(JSON.stringify(first.payload));
  });
});
