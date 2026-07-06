/**
 * W-106 - attenuation-only token minting: POST /v1/tokens never
 * escalates past the caller's own grant. A token holding only
 * `tokens:create` can no longer mint itself `admin:*`; delegation
 * chains narrow monotonically. The anonymous (auth disabled) operator
 * is exempt by construction.
 */
import { createToken } from '@graphorin/security/auth';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_PEPPER_W106';
const PEPPER_VALUE = 'w106-pepper-bytes-8LnB4rVsYq2eKd6h';

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;

afterEach(async () => {
  if (server !== undefined) {
    await server.stop().catch(() => {});
    server = undefined;
  }
  if (store !== undefined) {
    await store.close().catch(() => {});
    store = undefined;
  }
  delete process.env[PEPPER_ENV];
});

async function bootWithToken(scopes: ReadonlyArray<string>): Promise<string> {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env[PEPPER_ENV] = PEPPER_VALUE;
  store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  server = await createServer({
    store,
    skipHardening: true,
    skipListen: true,
    config: {
      auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
      storage: { path: ':memory:', mode: 'lib' },
      server: { rateLimit: { enabled: false }, csrf: { enabled: false } },
    },
  });
  await server.start();
  const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: [...scopes],
  });
  return await minted.raw.use((v) => v);
}

function mint(bearer: string | undefined, scopes: ReadonlyArray<string>) {
  if (server === undefined) throw new Error('not booted');
  return server.app.request('/v1/tokens', {
    method: 'POST',
    headers: {
      ...(bearer !== undefined ? { Authorization: `Bearer ${bearer}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ label: 't', scopes }),
  });
}

describe('W-106 - attenuation-only minting', () => {
  it("a bare ['tokens:create'] caller cannot mint admin:*", async () => {
    const bearer = await bootWithToken(['tokens:create']);
    const res = await mint(bearer, ['admin:*']);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string; denied: string[] };
    expect(body.error).toBe('scope-escalation-denied');
    expect(body.denied).toEqual(['admin:*']);
  });

  it('minting a subset of the own grant succeeds', async () => {
    const bearer = await bootWithToken(['tokens:create', 'sessions:read', 'agents:invoke']);
    const res = await mint(bearer, ['sessions:read']);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { token: { scopes: string[] } };
    expect(body.token.scopes).toEqual(['sessions:read']);
  });

  it('a two-segment grant covers three-segment requests, and admin:* mints anything', async () => {
    const wide = await bootWithToken(['admin:*']);
    const res = await mint(wide, ['agents:invoke', 'sessions:read:abc', 'tokens:create']);
    expect(res.status).toBe(201);
  });

  it('a three-segment grant does NOT cover the wider two-segment request', async () => {
    const bearer = await bootWithToken(['tokens:create', 'agents:invoke:foo']);
    const narrowOk = await mint(bearer, ['agents:invoke:foo']);
    expect(narrowOk.status).toBe(201);
    const escalation = await mint(bearer, ['agents:invoke']);
    expect(escalation.status).toBe(403);
    const body = (await escalation.json()) as { denied: string[] };
    expect(body.denied).toEqual(['agents:invoke']);
  });

  it('syntactically invalid scopes answer 400, not a token granting nothing', async () => {
    const bearer = await bootWithToken(['admin:*']);
    const res = await mint(bearer, ['not a scope!!']);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('config-invalid');
  });

  it("auth 'none' does not mount the token routes at all (the anonymous exemption is defense-in-depth)", async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env[PEPPER_ENV] = PEPPER_VALUE;
    store = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    server = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        server: { rateLimit: { enabled: false }, csrf: { enabled: false } },
      },
    });
    await server.start();
    // Token minting needs the token infrastructure (pepper + store);
    // under `auth: none` the routes are simply absent - the W-106
    // anonymous exemption in the handler guards nonstandard mounts.
    const res = await mint(undefined, ['admin:*']);
    expect(res.status).toBe(404);
  });
});
