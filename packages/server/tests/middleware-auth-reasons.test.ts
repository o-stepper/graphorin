import { createToken, generatePepper, type ParsedScope, TokenVerifier } from '@graphorin/security';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { ServerVariables } from '../src/internal/context.js';
import { createAuthMiddleware } from '../src/middleware/auth.js';
import { createRequestStateMiddleware } from '../src/middleware/request-state.js';
import { InMemoryAuthTokenStore } from './fixtures/in-memory-token-store.js';

async function setup() {
  const tokenStore = new InMemoryAuthTokenStore();
  const pepper = generatePepper();
  const created = await createToken({
    tokenStore,
    pepper,
    env: 'live',
    scopes: ['agents:read'],
  });
  const verifier = new TokenVerifier({ tokenStore, pepper });
  const raw = await created.raw.use((v) => v);
  return { tokenStore, pepper, created, verifier, raw };
}

function buildApp(verifier: TokenVerifier, trustProxy = false) {
  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', createRequestStateMiddleware({ trustProxy }));
  app.use('*', createAuthMiddleware({ verifier }));
  app.get('/echo', (c) => c.json({ ok: true, token: c.get('token') ?? null }));
  return app;
}

describe('createAuthMiddleware — failure reasons', () => {
  it('returns 401 with auth-revoked when the token is revoked', async () => {
    const { verifier, created, tokenStore, raw } = await setup();
    await tokenStore.revoke(created.record.id, new Date().toISOString());
    const res = await buildApp(verifier).request('/echo', {
      headers: { Authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('auth-revoked');
  });

  it('returns 401 with auth-expired when the token is expired', async () => {
    const tokenStore = new InMemoryAuthTokenStore();
    const pepper = generatePepper();
    const expired = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
      expiresAt: Date.now() - 60_000,
    });
    const verifier = new TokenVerifier({ tokenStore, pepper });
    const raw = await expired.raw.use((v) => v);
    const res = await buildApp(verifier).request('/echo', {
      headers: { Authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('auth-expired');
  });

  it('returns 429 with Retry-After once the per-IP lockout trips', async () => {
    const tokenStore = new InMemoryAuthTokenStore();
    const pepper = generatePepper();
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      perIpFailureThreshold: 2,
      perIpWindowMs: 60_000,
      perIpLockoutMs: 60_000,
    });
    const app = buildApp(verifier, true);
    // Each request from the same IP fails — after 2 failures the lockout trips.
    const headers = { Authorization: 'Bearer not-real', 'X-Forwarded-For': '9.9.9.9' };
    await app.request('/echo', { headers });
    await app.request('/echo', { headers });
    const third = await app.request('/echo', { headers });
    expect(third.status).toBe(429);
    expect(third.headers.get('Retry-After')).toBeDefined();
    const body = (await third.json()) as { error: string };
    expect(body.error).toBe('auth-locked-out');
  });

  it('mirrors the verified token onto c.var.token in the documented shape', async () => {
    const { verifier, raw, created } = await setup();
    const res = await buildApp(verifier).request('/echo', {
      headers: { Authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      token: { id: string; label?: string; env: string; scopes: ParsedScope[] };
    };
    expect(body.token.id).toBe(created.record.id);
    expect(body.token.env).toBe('live');
    expect(body.token.scopes.length).toBeGreaterThan(0);
  });
});
