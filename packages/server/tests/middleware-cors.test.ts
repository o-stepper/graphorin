import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { parseServerConfig } from '../src/config.js';
import type { ServerVariables } from '../src/internal/context.js';
import { createCorsMiddleware } from '../src/middleware/cors.js';
import { createRequestStateMiddleware } from '../src/middleware/request-state.js';

function buildApp(allowOrigins: string[], allowCredentials = false) {
  const config = parseServerConfig({
    server: { cors: { allowOrigins, allowCredentials } },
  });
  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', createRequestStateMiddleware());
  app.use('*', createCorsMiddleware(config.server.cors));
  app.get('/echo', (c) => c.json({ ok: true }));
  return app;
}

describe('createCorsMiddleware', () => {
  it('skips CORS headers for same-origin requests', async () => {
    const app = buildApp(['https://app.example.com']);
    const res = await app.request('/echo');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('echoes back allowed origins explicitly', async () => {
    const app = buildApp(['https://app.example.com']);
    const res = await app.request('/echo', { headers: { Origin: 'https://app.example.com' } });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
    expect(res.headers.get('Vary')).toBe('Origin');
  });

  it('omits the allow header for disallowed origins', async () => {
    const app = buildApp(['https://app.example.com']);
    const res = await app.request('/echo', { headers: { Origin: 'https://evil.example.com' } });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('returns 204 with allow headers on a preflight', async () => {
    const app = buildApp(['https://app.example.com']);
    const res = await app.request('/echo', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://app.example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('uses the request origin when allowAny + credentials is on', async () => {
    const app = buildApp(['*'], true);
    const res = await app.request('/echo', { headers: { Origin: 'https://b.example.com' } });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://b.example.com');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('returns plain * when allowAny is on without credentials', async () => {
    const app = buildApp(['*']);
    const res = await app.request('/echo', { headers: { Origin: 'https://x.example.com' } });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
