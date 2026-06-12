/**
 * `Last-Event-ID` resume integration test for the SSE fallback. We
 * boot the server, pre-emit a few events into the dispatcher's
 * replay buffer, then issue an HTTP request with the
 * `Last-Event-ID` header and assert the responder replays from
 * that cursor (and ONLY events after it).
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

let server: GraphorinServer | undefined;
let rawToken = '';

async function setupStore() {
  return createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
}

beforeAll(async () => {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env.GRAPHORIN_TEST_PEPPER_SSE_LEI = 'pepper-with-plenty-of-entropy-aB3xK9-LEI';
  const store = await setupStore();
  server = await createServer({
    store,
    skipHardening: true,
    skipListen: true,
    config: {
      auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER_SSE_LEI' },
      storage: { path: ':memory:', mode: 'lib' },
      server: {
        rateLimit: { enabled: false },
        csrf: { enabled: false },
      },
    },
  });
  await server.start();

  const { createToken } = await import('@graphorin/security');
  const { resolveSecret } = await import('@graphorin/security/secrets');
  const pepper = await resolveSecret('env:GRAPHORIN_TEST_PEPPER_SSE_LEI');
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ['sessions:read', 'agents:invoke:abc'],
  });
  rawToken = await minted.raw.use((value) => value);
});

afterAll(async () => {
  if (server !== undefined) await server.stop();
  delete process.env.GRAPHORIN_TEST_PEPPER_SSE_LEI;
});

async function streamUntilFirstEvent(
  controller: AbortController,
  lastEventId?: string,
): Promise<string> {
  if (server === undefined) throw new Error('server missing');
  const headers: Record<string, string> = { Authorization: `Bearer ${rawToken}` };
  if (lastEventId !== undefined) headers['Last-Event-ID'] = lastEventId;
  const responsePromise = server.app.request('/v1/sessions/abc/events', {
    method: 'GET',
    headers,
    signal: controller.signal,
  });
  setTimeout(() => controller.abort(), 100);
  const response = await responsePromise;
  expect(response.status).toBe(200);
  const reader = response.body?.getReader();
  if (reader === undefined) throw new Error('SSE body missing');
  const decoder = new TextDecoder();
  let accumulated = '';
  try {
    for (let i = 0; i < 50; i += 1) {
      const { value, done } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value);
      if (accumulated.includes('id:')) break;
    }
  } catch {
    // request aborted — return whatever we got.
  }
  try {
    reader.releaseLock();
  } catch {
    // ignore
  }
  return accumulated;
}

describe('SSE Last-Event-ID resume', () => {
  it('with no Last-Event-ID, the responder replays every buffered event', async () => {
    const dispatcher = server?.wsDispatcher;
    if (dispatcher === undefined) throw new Error('dispatcher missing');
    dispatcher.emit('session:abc/events', {
      type: 'text.delta',
      payload: { delta: 'first' },
    });
    dispatcher.emit('session:abc/events', {
      type: 'text.delta',
      payload: { delta: 'second' },
    });
    const controller = new AbortController();
    const body = await streamUntilFirstEvent(controller);
    expect(body).toContain('first');
  });

  it('with Last-Event-ID set to the cursor of the first event, the responder skips that event', async () => {
    const dispatcher = server?.wsDispatcher;
    if (dispatcher === undefined) throw new Error('dispatcher missing');
    // Reset by forgetting + re-pushing.
    dispatcher.replayBuffer.forget('session:abc/events');
    dispatcher.emit('session:abc/events', {
      type: 'text.delta',
      payload: { delta: 'one' },
    });
    dispatcher.emit('session:abc/events', {
      type: 'text.delta',
      payload: { delta: 'two' },
    });
    const replay = dispatcher.replayBuffer.replay('session:abc/events', undefined);
    const firstEventId = replay.events[0]?.eventId;
    expect(firstEventId).toBeDefined();
    if (firstEventId === undefined) return;

    const controller = new AbortController();
    const body = await streamUntilFirstEvent(controller, firstEventId);
    expect(body).toContain('two');
    expect(body).not.toContain('"delta":"one"');
  });
});
