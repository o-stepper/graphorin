/**
 * E-02 (S-15/8): the subscribe RPC reply must reach the wire BEFORE
 * any replayed frames. Clients key their subscription map off the
 * reply, so replayed frames sent earlier are dropped on the floor -
 * exactly on the fresh-subscribe and reconnect-resume paths the
 * replay buffer exists for.
 *
 * Two layers are pinned here:
 *  - dispatcher: `subscribe({ deferReplay: true })` captures the
 *    replay without delivering it until `dispatchReplay()` runs;
 *  - wire: a real server + real WebSocket sees the RPC reply first,
 *    then the `subscribed` notification, then the replayed frames in
 *    buffer order.
 */

import type { ServerEventFrame, ServerMessage } from '@graphorin/protocol';
import { parseScope } from '@graphorin/security/auth';
import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { createServer, type GraphorinServer } from '../src/app.js';
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

describe('WsDispatcher deferReplay (E-02)', () => {
  it('captures the replay without delivering until dispatchReplay() runs', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber('s1', ['sessions:read:*']);
    dispatcher.registerSubscriber(sub.handle);
    for (let i = 0; i < 3; i += 1) {
      dispatcher.emit('session:abc/events', {
        type: 'text.delta',
        payload: { delta: `chunk-${i}` },
      });
    }

    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-x',
      deferReplay: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Counts are computed at subscribe time, delivery is not.
    expect(result.replayedCount).toBe(3);
    expect(sub.sent).toHaveLength(0);

    result.dispatchReplay();
    const deltas = sub.sent
      .filter((frame): frame is ServerEventFrame => 'kind' in frame && frame.kind === 'event')
      .map((frame) => (frame.payload as { delta: string }).delta);
    expect(deltas).toEqual(['chunk-0', 'chunk-1', 'chunk-2']);
    // lastEventId advanced through the replay exactly like before.
    expect(dispatcher.snapshotSubscription('sub-x')?.lastEventId).toBe(
      (sub.sent.at(-1) as ServerEventFrame).eventId,
    );

    // Idempotent: a second call must not double-deliver.
    result.dispatchReplay();
    expect(sub.sent).toHaveLength(3);
  });

  it('still replays inline when deferReplay is not requested', () => {
    const dispatcher = createWsDispatcher();
    const sub = makeSubscriber('s1', ['sessions:read:*']);
    dispatcher.registerSubscriber(sub.handle);
    dispatcher.emit('session:abc/events', { type: 'text.delta', payload: { delta: 'only' } });

    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-y',
    });
    expect(result.ok).toBe(true);
    expect(sub.sent).toHaveLength(1);
    if (result.ok) {
      // Already delivered - the returned hook is a no-op.
      result.dispatchReplay();
    }
    expect(sub.sent).toHaveLength(1);
  });

  it('defers the replay-marker alongside the replayed frames', () => {
    const dispatcher = createWsDispatcher({ replayBuffer: { maxEvents: 2 } });
    const sub = makeSubscriber('s1', ['sessions:read:*']);
    dispatcher.registerSubscriber(sub.handle);
    for (let i = 0; i < 5; i += 1) {
      dispatcher.emit('session:abc/events', {
        type: 'text.delta',
        payload: { delta: `chunk-${i}` },
      });
    }

    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: 'session:abc/events',
      subscriptionId: 'sub-z',
      sinceEventId: 'evt-not-in-buffer',
      deferReplay: true,
    });
    expect(result.ok).toBe(true);
    expect(sub.sent).toHaveLength(0);
    if (result.ok) result.dispatchReplay();
    const marker = sub.sent.find((frame) => 'kind' in frame && frame.kind === 'replay-marker');
    expect(marker).toBeDefined();
  });
});

describe('WebSocket wire order: RPC reply precedes replayed frames (E-02)', () => {
  let server: GraphorinServer | undefined;
  let rawToken = '';
  let port = 0;

  beforeAll(async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_TEST_PEPPER_REPLAY_ORDER = 'pepper-with-plenty-of-entropy-replay-order';
    const store = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    server = await createServer({
      store,
      skipHardening: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER_REPLAY_ORDER' },
        storage: { path: ':memory:', mode: 'lib' },
        server: {
          host: '127.0.0.1',
          port: 0,
          rateLimit: { enabled: false },
          csrf: { enabled: false },
        },
      },
    });
    const listening = await server.start();
    port = listening.port;

    const { createToken } = await import('@graphorin/security');
    const { resolveSecret } = await import('@graphorin/security/secrets');
    const pepper = await resolveSecret('env:GRAPHORIN_TEST_PEPPER_REPLAY_ORDER');
    const minted = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['sessions:read:*'],
    });
    rawToken = await minted.raw.use((value) => value);
  });

  afterAll(async () => {
    if (server !== undefined) await server.stop();
    delete process.env.GRAPHORIN_TEST_PEPPER_REPLAY_ORDER;
  });

  it('replays buffered events only after the subscribe reply and subscribed frame', async () => {
    if (server === undefined) throw new Error('server missing');
    const dispatcher = server.wsDispatcher;
    if (dispatcher === undefined) throw new Error('dispatcher missing');
    // Buffer events BEFORE the subscription exists - the fresh
    // subscribe replays the whole buffer.
    for (let i = 0; i < 3; i += 1) {
      dispatcher.emit('session:order/events', {
        type: 'text.delta',
        payload: { delta: `pre-${i}` },
      });
    }

    const frames: Array<Record<string, unknown>> = [];
    const framesArrived = (count: number) =>
      new Promise<void>((resolve, reject) => {
        const deadline = setTimeout(() => reject(new Error('timed out waiting for frames')), 5000);
        const check = () => {
          if (frames.length >= count) {
            clearTimeout(deadline);
            resolve();
            return;
          }
          setTimeout(check, 5);
        };
        check();
      });

    const ws = new WebSocket(`ws://127.0.0.1:${port}/v1/ws`, ['graphorin.protocol.v1'], {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    try {
      await new Promise<void>((resolve, reject) => {
        ws.once('open', () => resolve());
        ws.once('error', (err) => reject(err));
      });
      ws.on('message', (raw: WebSocket.Data) => {
        frames.push(JSON.parse(raw.toString()) as Record<string, unknown>);
      });

      ws.send(
        JSON.stringify({
          v: '1',
          jsonrpc: '2.0',
          id: 'init-1',
          method: 'initialize',
          params: { clientInfo: { name: 'graphorin-test', version: '0.1.0' } },
        }),
      );
      await framesArrived(1);
      expect(frames[0]?.id).toBe('init-1');
      frames.length = 0;

      ws.send(
        JSON.stringify({
          v: '1',
          jsonrpc: '2.0',
          id: 'sub-1',
          method: 'subscription.subscribe',
          params: { subject: 'session:order/events' },
        }),
      );
      // Expect: reply, subscribed, then the 3 replayed events.
      await framesArrived(5);

      const reply = frames[0] as { id?: string; result?: { subscriptionId?: string } };
      expect(reply.id).toBe('sub-1');
      const subscriptionId = reply.result?.subscriptionId;
      expect(typeof subscriptionId).toBe('string');

      expect(frames[1]?.kind).toBe('subscribed');
      expect(frames[1]?.subscriptionId).toBe(subscriptionId);

      const replayed = frames.slice(2, 5) as Array<{
        kind?: string;
        subscriptionId?: string;
        payload?: { delta?: string };
      }>;
      for (const frame of replayed) {
        expect(frame.kind).toBe('event');
        expect(frame.subscriptionId).toBe(subscriptionId);
      }
      // Replay order preserved.
      expect(replayed.map((f) => f.payload?.delta)).toEqual(['pre-0', 'pre-1', 'pre-2']);
    } finally {
      ws.close();
    }
  });
});
