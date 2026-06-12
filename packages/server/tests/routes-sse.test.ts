import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import { createServer } from '../src/app.js';

async function setupStore() {
  return createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
}

describe('SSE fallback', () => {
  it('streams a buffered event then closes when the request is aborted', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env.GRAPHORIN_TEST_PEPPER_SSE = 'pepper-with-plenty-of-entropy-aB3xK9-SSE';
    const store = await setupStore();
    const server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER_SSE' },
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
    const pepper = await resolveSecret('env:GRAPHORIN_TEST_PEPPER_SSE');
    const minted = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['sessions:read', 'agents:invoke:abc'],
    });
    const raw = await minted.raw.use((value) => value);

    // Pre-buffer one event before subscribing.
    const dispatcher = server.wsDispatcher;
    expect(dispatcher).toBeDefined();
    if (dispatcher === undefined) throw new Error('dispatcher missing');
    dispatcher.emit('session:abc/events', {
      type: 'text.delta',
      payload: { delta: 'hello' },
    });

    const controller = new AbortController();
    const responsePromise = server.app.request('/v1/sessions/abc/events', {
      method: 'GET',
      headers: { Authorization: `Bearer ${raw}` },
      signal: controller.signal,
    });

    // Give the response a tick so headers get sent + replay buffer
    // gets drained, then abort to release the streaming generator.
    setTimeout(() => controller.abort(), 50);
    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    // Read the body chunks until aborted; the buffered event should be
    // present in the resulting payload.
    const reader = response.body?.getReader();
    if (reader === undefined) throw new Error('SSE body missing');
    let collected = '';
    try {
      for (let i = 0; i < 50; i += 1) {
        const { value, done } = await reader.read();
        if (done) break;
        collected += new TextDecoder().decode(value);
        if (collected.includes('data:')) break;
      }
    } catch {
      // The request was aborted; treat as end-of-stream.
    }
    try {
      reader.releaseLock?.();
    } catch {
      // ignore
    }
    expect(collected).toContain('data:');
    expect(collected).toContain('hello');

    await server.stop();
    delete process.env.GRAPHORIN_TEST_PEPPER_SSE;
  });
});
