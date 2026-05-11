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
