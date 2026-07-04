import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { parseServerConfig } from '../src/config.js';
import type { ServerVariables } from '../src/internal/context.js';
import { createIdempotencyMiddleware } from '../src/middleware/idempotency.js';
import { createRequestStateMiddleware } from '../src/middleware/request-state.js';
import { InMemoryIdempotencyStore } from './fixtures/in-memory-idempotency-store.js';

function buildApp(
  opts: {
    requireKey?: 'off' | 'warn' | 'enforce';
    ttlSeconds?: number;
    checkBodyFingerprint?: boolean;
  } = {},
) {
  const overrides: Record<string, unknown> = {};
  if (opts.requireKey !== undefined) overrides.requireKey = opts.requireKey;
  if (opts.ttlSeconds !== undefined) overrides.ttlSeconds = opts.ttlSeconds;
  if (opts.checkBodyFingerprint !== undefined)
    overrides.checkBodyFingerprint = opts.checkBodyFingerprint;
  const config = parseServerConfig({ server: { idempotency: overrides } });
  const store = new InMemoryIdempotencyStore();
  let counter = 0;
  let now = 0;
  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', createRequestStateMiddleware({ now: () => now }));
  app.use(
    '*',
    createIdempotencyMiddleware({ store, config: config.server.idempotency, now: () => now }),
  );
  app.post('/run', async (c) => {
    const body = await c.req.json();
    counter += 1;
    // Yield one macrotask so concurrent-duplicate tests overlap
    // deterministically with the in-flight window.
    await new Promise((resolve) => setTimeout(resolve, 5));
    return c.json({ counter, echoed: body }, 201);
  });
  return { app, store, counter: () => counter, advance: (ms: number) => (now += ms) };
}

describe('createIdempotencyMiddleware', () => {
  it('caches a successful response and replays it on retry', async () => {
    const { app, counter } = buildApp();
    const headers = {
      'Content-Type': 'application/json',
      'Idempotency-Key': '0192c3b1-6e60-7b4b-a9c8-1234567890ab',
    };
    const body = JSON.stringify({ foo: 'bar' });
    const first = await app.request('/run', { method: 'POST', headers, body });
    expect(first.status).toBe(201);
    expect(counter()).toBe(1);
    const second = await app.request('/run', { method: 'POST', headers, body });
    expect(second.status).toBe(201);
    expect(counter()).toBe(1);
    expect(second.headers.get('Idempotency-Replayed')).toBe('true');
    const json = (await second.json()) as { counter: number };
    expect(json.counter).toBe(1);
  });

  it('a CONCURRENT duplicate is rejected 409 in-flight instead of double-executing (periphery-08)', async () => {
    const { app, counter } = buildApp();
    const headers = {
      'Content-Type': 'application/json',
      'Idempotency-Key': 'concurrent-key-0001',
    };
    const body = JSON.stringify({ foo: 'bar' });
    // Fire both requests without awaiting the first — pre-fix the
    // record landed only after next(), so both missed the cache and
    // both executed (a double agent run).
    const [first, second] = await Promise.all([
      app.request('/run', { method: 'POST', headers, body }),
      app.request('/run', { method: 'POST', headers, body }),
    ]);
    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
    expect(counter()).toBe(1);
    const rejected = first.status === 409 ? first : second;
    const rejectedBody = (await rejected.json()) as { error: string };
    expect(rejectedBody.error).toBe('idempotency-in-flight');
    expect(rejected.headers.get('Retry-After')).toBe('1');
    // Once the winner finished, a retry replays its cached response.
    const third = await app.request('/run', { method: 'POST', headers, body });
    expect(third.status).toBe(201);
    expect(third.headers.get('Idempotency-Replayed')).toBe('true');
    expect(counter()).toBe(1);
  });

  it('rejects with 409 when the body fingerprint mismatches', async () => {
    const { app } = buildApp();
    const headers = {
      'Content-Type': 'application/json',
      'Idempotency-Key': '0192c3b1-6e60-7b4b-a9c8-aaaabbbbcccc',
    };
    const a = await app.request('/run', {
      method: 'POST',
      headers,
      body: JSON.stringify({ x: 1 }),
    });
    expect(a.status).toBe(201);
    const b = await app.request('/run', {
      method: 'POST',
      headers,
      body: JSON.stringify({ x: 2 }),
    });
    expect(b.status).toBe(409);
    const body = (await b.json()) as { error: string };
    expect(body.error).toBe('idempotency-conflict');
  });

  it('with requireKey=enforce, missing header returns 400', async () => {
    const { app } = buildApp({ requireKey: 'enforce' });
    const res = await app.request('/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('idempotency-key-required');
  });

  it('with requireKey=warn, missing header passes with hint header', async () => {
    const { app } = buildApp({ requireKey: 'warn' });
    const res = await app.request('/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get('Idempotency-Status')).toBe('header-missing');
  });

  it('safe methods are passed through without consulting the store', async () => {
    const { app, store } = buildApp();
    // GET on a POST-only route returns 404 (Hono default), but the
    // middleware itself never inspects the store on safe methods.
    const get = await app.request('/run', { method: 'GET' });
    expect(get.status).toBe(404);
    expect(store.rows.size).toBe(0);
  });

  it('refuses keys outside the [A-Za-z0-9_:-]{8,255} grammar', async () => {
    const { app } = buildApp();
    const res = await app.request('/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'tiny' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('expired records are evicted on next access', async () => {
    const { app, advance, counter } = buildApp({ ttlSeconds: 1 });
    const headers = {
      'Content-Type': 'application/json',
      'Idempotency-Key': '0192c3b1-aaaa-bbbb-cccc-dddddddddddd',
    };
    const body = JSON.stringify({ y: 1 });
    const first = await app.request('/run', { method: 'POST', headers, body });
    expect(first.status).toBe(201);
    expect(counter()).toBe(1);
    advance(2_000);
    const second = await app.request('/run', { method: 'POST', headers, body });
    expect(second.status).toBe(201);
    expect(counter()).toBe(2);
  });
});

describe('IP-6 — principal binding + secret-endpoint exclusion', () => {
  function buildAuthedApp(): {
    readonly app: Hono<{ Variables: ServerVariables }>;
    readonly store: InMemoryIdempotencyStore;
    readonly counter: () => number;
  } {
    const config = parseServerConfig({});
    const store = new InMemoryIdempotencyStore();
    let counter = 0;
    const app = new Hono<{ Variables: ServerVariables }>();
    app.use('*', createRequestStateMiddleware({}));
    // Inject a per-request principal from the X-Test-Token header (the
    // real auth middleware sets the same state shape).
    app.use('*', async (c, next) => {
      const tokenId = c.req.header('x-test-token');
      if (tokenId !== undefined) {
        c.set('state', {
          ...c.get('state'),
          auth: {
            kind: 'token' as const,
            token: { tokenId } as never,
            grantedScopes: [],
          },
        });
      }
      await next();
    });
    app.use(
      '*',
      createIdempotencyMiddleware({
        store,
        config: config.server.idempotency,
        excludeResponseCachePaths: ['/tokens'],
      }),
    );
    app.post('/run', async (c) => {
      counter += 1;
      return c.json({ counter }, 201);
    });
    app.post('/tokens', async (c) => {
      counter += 1;
      return c.json({ token: `gph_live_secret_${counter}` }, 201);
    });
    return { app, store, counter: () => counter };
  }

  it('a replay from a DIFFERENT principal is rejected, same principal replays fine', async () => {
    const { app, counter } = buildAuthedApp();
    const post = (token: string) =>
      app.request('/run', {
        method: 'POST',
        headers: {
          'Idempotency-Key': 'shared-key-1',
          'Content-Type': 'application/json',
          'X-Test-Token': token,
        },
        body: JSON.stringify({ v: 1 }),
      });
    const first = await post('tok-alice');
    expect(first.status).toBe(201);
    // Same principal → cached replay.
    const replay = await post('tok-alice');
    expect(replay.status).toBe(201);
    expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
    expect(counter()).toBe(1);
    // Different principal, same key + body → rejected, NOT replayed.
    const stolen = await post('tok-mallory');
    expect(stolen.status).toBe(409);
    expect(counter()).toBe(1);
  });

  it('secret-bearing endpoints are excluded: nothing cached, repeats re-execute', async () => {
    const { app, store, counter } = buildAuthedApp();
    const mint = () =>
      app.request('/tokens', {
        method: 'POST',
        headers: {
          'Idempotency-Key': 'mint-1',
          'Content-Type': 'application/json',
          'X-Test-Token': 'tok-admin',
        },
        body: JSON.stringify({}),
      });
    const a = (await (await mint()).json()) as { token: string };
    const b = (await (await mint()).json()) as { token: string };
    // Re-executed (no replay) — a fresh secret each time…
    expect(a.token).not.toBe(b.token);
    expect(counter()).toBe(2);
    // …and the raw secret is NEVER persisted in the idempotency store.
    const dump = JSON.stringify(await store.get('mint-1'));
    expect(dump).not.toContain('gph_live_secret_');
  });
});
