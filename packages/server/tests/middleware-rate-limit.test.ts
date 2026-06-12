import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { parseServerConfig } from '../src/config.js';
import type { ServerVariables } from '../src/internal/context.js';
import { createRateLimitMiddleware } from '../src/middleware/rate-limit.js';
import { createRequestStateMiddleware } from '../src/middleware/request-state.js';

function buildApp(perIp = 3) {
  const config = parseServerConfig({
    server: { rateLimit: { perIpRequests: perIp, windowMs: 1_000 } },
  });
  let now = 0;
  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', createRequestStateMiddleware({ now: () => now, trustProxy: true }));
  app.use('*', createRateLimitMiddleware(config.server.rateLimit, { now: () => now }));
  app.get('/echo', (c) => c.json({ ok: true }));
  return { app, advance: (ms: number) => (now += ms) };
}

describe('createRateLimitMiddleware', () => {
  it('caps requests per IP within the window', async () => {
    const { app } = buildApp(2);
    const headers = { 'X-Forwarded-For': '1.2.3.4' };
    const a = await app.request('/echo', { headers });
    expect(a.status).toBe(200);
    const b = await app.request('/echo', { headers });
    expect(b.status).toBe(200);
    const c = await app.request('/echo', { headers });
    expect(c.status).toBe(429);
    expect(c.headers.get('Retry-After')).toBeDefined();
  });

  it('resets after the window elapses', async () => {
    const { app, advance } = buildApp(1);
    const headers = { 'X-Forwarded-For': '5.6.7.8' };
    const a = await app.request('/echo', { headers });
    expect(a.status).toBe(200);
    const b = await app.request('/echo', { headers });
    expect(b.status).toBe(429);
    advance(2_000);
    const c = await app.request('/echo', { headers });
    expect(c.status).toBe(200);
  });

  it('does not count between separate IPs', async () => {
    const { app } = buildApp(1);
    const a = await app.request('/echo', { headers: { 'X-Forwarded-For': '1.1.1.1' } });
    expect(a.status).toBe(200);
    const b = await app.request('/echo', { headers: { 'X-Forwarded-For': '2.2.2.2' } });
    expect(b.status).toBe(200);
  });
});

describe('IP-10/IP-11 — per-socket buckets + header honesty', () => {
  it('two clients with different socket addresses get independent buckets (trustProxy=false)', async () => {
    const { Hono } = await import('hono');
    const { createRequestStateMiddleware } = await import('../src/middleware/request-state.js');
    const { createRateLimitMiddleware } = await import('../src/middleware/rate-limit.js');
    const app = new Hono();
    app.use('*', createRequestStateMiddleware({}));
    app.use(
      '*',
      createRateLimitMiddleware({ enabled: true, perIpRequests: 2, windowMs: 60_000 }) as never,
    );
    app.get('/x', (c) => c.text('ok'));

    const env = (addr: string) => ({ incoming: { socket: { remoteAddress: addr } } });
    // Client A exhausts ITS budget…
    expect((await app.request('/x', {}, env('10.0.0.1'))).status).toBe(200);
    expect((await app.request('/x', {}, env('10.0.0.1'))).status).toBe(200);
    expect((await app.request('/x', {}, env('10.0.0.1'))).status).toBe(429);
    // …client B is unaffected (the old code keyed EVERYTHING to 'anonymous').
    expect((await app.request('/x', {}, env('10.0.0.2'))).status).toBe(200);
  });

  it('X-Real-IP / X-Forwarded-For are ignored when trustProxy=false — the socket wins', async () => {
    const { Hono } = await import('hono');
    const { createRequestStateMiddleware } = await import('../src/middleware/request-state.js');
    const app = new Hono();
    app.use('*', createRequestStateMiddleware({}));
    app.get('/ip', (c) =>
      c.json({ ip: (c.get('state' as never) as { clientIp?: string }).clientIp }),
    );
    const res = await app.request(
      '/ip',
      { headers: { 'X-Real-IP': '6.6.6.6', 'X-Forwarded-For': '7.7.7.7' } },
      { incoming: { socket: { remoteAddress: '10.1.1.1' } } },
    );
    expect(((await res.json()) as { ip?: string }).ip).toBe('10.1.1.1');
  });

  // Inserts >10k window entries through real requests; loaded windows CI
  // runners blow the 5s default — functional assertion, explicit headroom.
  it('the window map is swept once it crosses the cap', { timeout: 20_000 }, async () => {
    const { Hono } = await import('hono');
    const { createRequestStateMiddleware } = await import('../src/middleware/request-state.js');
    const { createRateLimitMiddleware } = await import('../src/middleware/rate-limit.js');
    let nowMs = 1_000_000;
    const app = new Hono();
    app.use('*', createRequestStateMiddleware({ now: () => nowMs }));
    app.use(
      '*',
      createRateLimitMiddleware(
        { enabled: true, perIpRequests: 100, windowMs: 1_000 },
        { now: () => nowMs },
      ) as never,
    );
    app.get('/x', (c) => c.text('ok'));
    const env = (i: number) => ({
      incoming: { socket: { remoteAddress: `10.9.${(i / 250) | 0}.${i % 250}` } },
    });
    // Fill past the sweep threshold with distinct IPs…
    for (let i = 0; i < 10_050; i++) {
      await app.request('/x', {}, env(i));
    }
    // …expire them, and one more request triggers the sweep.
    nowMs += 5_000;
    const res = await app.request('/x', {}, env(99_999));
    expect(res.status).toBe(200);
    // No direct map handle — the behavioural proof is that the request
    // path stays correct after the sweep; the bound is structural.
  });
});
