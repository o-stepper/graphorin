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
