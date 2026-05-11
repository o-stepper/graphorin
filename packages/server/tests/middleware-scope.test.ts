import { createToken, generatePepper, TokenVerifier } from '@graphorin/security';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { ServerVariables } from '../src/internal/context.js';
import { createAuthMiddleware } from '../src/middleware/auth.js';
import { createRequestStateMiddleware } from '../src/middleware/request-state.js';
import { createScopeMiddleware } from '../src/middleware/scope.js';
import { InMemoryAuthTokenStore } from './fixtures/in-memory-token-store.js';

async function setup(scopes: ReadonlyArray<string>) {
  const tokenStore = new InMemoryAuthTokenStore();
  const pepper = generatePepper();
  const created = await createToken({ tokenStore, pepper, env: 'live', scopes });
  const verifier = new TokenVerifier({ tokenStore, pepper });
  const raw = await created.raw.use((v) => v);
  return { verifier, raw };
}

function buildApp(verifier: TokenVerifier, requirement: string) {
  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', createRequestStateMiddleware());
  app.use('*', createAuthMiddleware({ verifier }));
  app.get('/echo', createScopeMiddleware(requirement), (c) => c.json({ ok: true }));
  return app;
}

describe('createScopeMiddleware', () => {
  it('grants access when the token carries the required scope', async () => {
    const { verifier, raw } = await setup(['agents:read']);
    const app = buildApp(verifier, 'agents:read');
    const res = await app.request('/echo', { headers: { Authorization: `Bearer ${raw}` } });
    expect(res.status).toBe(200);
  });

  it('denies access with 403 when the scope is missing', async () => {
    const { verifier, raw } = await setup(['memory:read']);
    const app = buildApp(verifier, 'agents:read');
    const res = await app.request('/echo', { headers: { Authorization: `Bearer ${raw}` } });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('scope-denied');
  });

  it('grants access when the token carries the wildcard admin:* scope', async () => {
    const { verifier, raw } = await setup(['admin:*']);
    const app = buildApp(verifier, 'agents:read');
    const res = await app.request('/echo', { headers: { Authorization: `Bearer ${raw}` } });
    expect(res.status).toBe(200);
  });

  it('returns 401 when the request is unauthenticated', async () => {
    const { verifier } = await setup(['agents:read']);
    const app = new Hono<{ Variables: ServerVariables }>();
    app.use('*', createRequestStateMiddleware());
    app.use('*', createAuthMiddleware({ verifier, allowAnonymous: true }));
    app.get('/x', createScopeMiddleware('agents:read'), (c) => c.json({ ok: true }));
    const res = await app.request('/x');
    expect(res.status).toBe(401);
  });
});
