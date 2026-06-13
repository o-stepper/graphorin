import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { parseServerConfig } from '../src/config.js';
import type { ServerVariables } from '../src/internal/context.js';
import { createCsrfMiddleware } from '../src/middleware/csrf.js';
import { createRequestStateMiddleware } from '../src/middleware/request-state.js';

function buildApp(enabled = true) {
  const config = parseServerConfig({ server: { csrf: { enabled } } });
  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', createRequestStateMiddleware());
  app.use('*', createCsrfMiddleware(config.server.csrf));
  app.post('/echo', (c) => c.json({ ok: true }));
  app.get('/echo', (c) => c.json({ ok: true }));
  return app;
}

describe('createCsrfMiddleware', () => {
  it('passes safe methods through and issues a fresh cookie', async () => {
    const app = buildApp();
    const res = await app.request('/echo');
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toContain('graphorin_csrf=');
  });

  it('IP-12: the CSRF cookie carries no HttpOnly attribute so an SPA can echo it', async () => {
    const app = buildApp();
    const res = await app.request('/echo');
    const cookie = res.headers.get('Set-Cookie') ?? '';
    expect(cookie).toContain('graphorin_csrf=');
    // RFC 6265: the mere presence of HttpOnly (even `HttpOnly=false`) enables
    // it, so document.cookie can't read the token for the double-submit echo.
    expect(cookie.toLowerCase()).not.toContain('httponly');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('passes bearer-authenticated requests through', async () => {
    const app = buildApp();
    const res = await app.request('/echo', {
      method: 'POST',
      headers: { Authorization: 'Bearer kru_x', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
  });

  it('rejects state-changing requests without a CSRF cookie', async () => {
    const app = buildApp();
    const res = await app.request('/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(403);
  });

  it('rejects state-changing requests when the header does not match the cookie', async () => {
    const app = buildApp();
    const res = await app.request('/echo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'graphorin_csrf=expected',
        'X-CSRF-Token': 'mismatch',
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(403);
  });

  it('accepts state-changing requests when header matches cookie', async () => {
    const app = buildApp();
    const res = await app.request('/echo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'graphorin_csrf=match',
        'X-CSRF-Token': 'match',
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
  });

  it('disabled middleware lets every request through', async () => {
    const app = buildApp(false);
    const res = await app.request('/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
  });
});
