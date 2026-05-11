import { createToken, generatePepper, TokenVerifier } from '@graphorin/security';
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
    label: 'test',
  });
  const verifier = new TokenVerifier({ tokenStore, pepper });
  return { tokenStore, pepper, created, verifier };
}

function buildApp(verifier: TokenVerifier, allowAnonymous = false) {
  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', createRequestStateMiddleware());
  app.use('*', createAuthMiddleware({ verifier, allowAnonymous }));
  app.get('/echo', (c) => {
    const auth = c.get('state').auth;
    if (auth.kind === 'token') return c.json({ ok: true, tokenId: auth.token.tokenId });
    return c.json({ ok: true, anonymous: true });
  });
  return app;
}

describe('createAuthMiddleware', () => {
  it('accepts a valid bearer token and populates c.var.state.auth', async () => {
    const { verifier, created } = await setup();
    const app = buildApp(verifier);
    const raw = await created.raw.use((value) => value);
    const res = await app.request('/echo', {
      headers: { Authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; tokenId: string };
    expect(body.ok).toBe(true);
    expect(body.tokenId).toBe(created.record.id);
  });

  it('returns 401 when the bearer header is absent', async () => {
    const { verifier } = await setup();
    const app = buildApp(verifier);
    const res = await app.request('/echo');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('auth-required');
  });

  it('returns 401 with discriminated reason on a bad bearer header', async () => {
    const { verifier } = await setup();
    const app = buildApp(verifier);
    const res = await app.request('/echo', {
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(['auth-invalid', 'auth-required']).toContain(body.error);
  });

  it('lets the request through when allowAnonymous = true', async () => {
    const { verifier } = await setup();
    const app = buildApp(verifier, true);
    const res = await app.request('/echo');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; anonymous: boolean };
    expect(body.anonymous).toBe(true);
  });
});
