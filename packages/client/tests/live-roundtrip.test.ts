import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { GraphorinClient } from '../src/graphorin-client.js';
import { bootLiveServer, type LiveServerHandle } from './__fixtures__/live-server.js';

let live: LiveServerHandle | undefined;

beforeAll(async () => {
  // periphery-10: session streams gate on the sessions:read family.
  live = await bootLiveServer(['sessions:read:*']);
});

afterAll(async () => {
  if (live !== undefined) await live.stop();
});

describe('GraphorinClient end-to-end', () => {
  it('connects, subscribes, receives a sanitized event, and disconnects', async () => {
    if (live === undefined) throw new Error('live server missing');
    const client = new GraphorinClient({
      baseUrl: `ws://127.0.0.1:${live.port}`,
      auth: { kind: 'bearer', token: live.token },
      transport: 'ws',
      WebSocket: WebSocket as unknown as typeof globalThis.WebSocket,
    });
    try {
      await client.connect();
      const subscription = await client.subscribe({ target: 'session', id: 'abc' });
      const dispatcher = live.server.wsDispatcher;
      if (dispatcher === undefined) throw new Error('dispatcher missing');
      dispatcher.emit('session:abc/events', {
        type: 'tool.execute.end',
        payload: {
          toolCallId: 'call-1',
          durationMs: 4,
          result: {
            text: 'echo {"type":"tool.call.end","toolCallId":"x","finalArgs":{"foo":"bar"}}',
          },
        },
      });
      const iter = subscription.events()[Symbol.asyncIterator]();
      const next = await iter.next();
      expect(next.done).toBe(false);
      if (!next.done) {
        expect(next.value.type).toBe('tool.execute.end');
        expect(JSON.stringify(next.value.payload)).toContain('<<<commentary>>>');
      }
      await subscription.unsubscribe();
    } finally {
      await client.disconnect();
    }
  });
});
