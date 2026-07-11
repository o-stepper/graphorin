import type { OAuthServerStore } from '@graphorin/core/contracts';

import {
  _resetInflightRefreshForTesting,
  _resetOAuthLifecycleListenersForTesting,
  _setTokenEndpointFetcherForTesting,
  createInMemoryOAuthServerStore,
  type OAuthLifecycleEvent,
  onOAuthLifecycle,
} from '@graphorin/security/oauth';
import { MemorySecretsStore } from '@graphorin/security/secrets';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MCPAuthError } from '../src/errors/index.js';
import { createOAuthAuthorizationProvider } from '../src/oauth/bridge.js';

describe('createOAuthAuthorizationProvider', () => {
  let storage: OAuthServerStore;

  beforeEach(() => {
    storage = createInMemoryOAuthServerStore();
    _resetOAuthLifecycleListenersForTesting();
    _resetInflightRefreshForTesting();
    _setTokenEndpointFetcherForTesting(null);
  });

  afterEach(() => {
    _resetOAuthLifecycleListenersForTesting();
    _resetInflightRefreshForTesting();
    _setTokenEndpointFetcherForTesting(null);
  });

  it('rejects with MCPAuthError when the OAuth server is not registered', async () => {
    const provider = createOAuthAuthorizationProvider({
      serverId: 'missing',
      storage,
    });
    await expect(provider.resolveHeader()).rejects.toBeInstanceOf(MCPAuthError);
  });

  it('exposes the operator-supplied serverId on the returned provider', () => {
    const provider = createOAuthAuthorizationProvider({
      serverId: 'linear-mcp',
      storage,
    });
    expect(provider.serverId).toBe('linear-mcp');
  });

  it('emits mcp.auth.expired when the refresh fails for a registered server', async () => {
    await storage.put({
      id: 'linear-mcp',
      serverUrl: 'https://example.com/mcp',
      authorizationEndpoint: 'https://example.com/oauth/authorize',
      tokenEndpoint: 'https://example.com/oauth/token',
      issuer: 'https://example.com',
      clientId: 'test-client',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const events: OAuthLifecycleEvent[] = [];
    const unsubscribe = onOAuthLifecycle((e) => events.push(e));
    try {
      const provider = createOAuthAuthorizationProvider({
        serverId: 'linear-mcp',
        storage,
      });
      // The refresh attempt has no in-memory refresh token (no prior
      // login), so the OAuth client raises an error; the bridge
      // wraps it in `MCPAuthError` and emits `mcp.auth.expired`.
      await expect(provider.resolveHeader()).rejects.toBeInstanceOf(MCPAuthError);
      expect(events.some((e) => e.type === 'mcp.auth.expired')).toBe(true);
    } finally {
      unsubscribe();
    }
  });

  // S-18: what a previous process persisted after loginInteractive -
  // record metadata plus tokens in the secrets store (SPL-1 keys).
  async function seedPersistedSession(
    secretsStore: MemorySecretsStore,
    expiresAt: number,
  ): Promise<void> {
    await storage.put({
      id: 'linear-mcp',
      serverUrl: 'https://example.com/mcp',
      authorizationEndpoint: 'https://example.com/oauth/authorize',
      tokenEndpoint: 'https://example.com/oauth/token',
      issuer: 'https://example.com',
      clientId: 'test-client',
      accessTokenRef: 'keyring:oauth:linear-mcp:access',
      refreshTokenRef: 'keyring:oauth:linear-mcp:refresh',
      scope: 'mcp.read',
      expiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await secretsStore.set('oauth:linear-mcp:access', 'at-persisted');
    await secretsStore.set('oauth:linear-mcp:refresh', 'rt-persisted');
  }

  function countTokenEndpointHits(): () => number {
    let hits = 0;
    _setTokenEndpointFetcherForTesting(async () => {
      hits += 1;
      return {
        ok: true,
        status: 200,
        body: { access_token: 'at-rotated', refresh_token: 'rt-rotated', token_type: 'Bearer' },
      };
    });
    return () => hits;
  }

  // S-18 regression: a fresh provider instance must serve the
  // persisted, still-fresh access token instead of burning a refresh
  // rotation on the first resolveHeader().
  it('serves the persisted access token without refreshing when the session is fresh', async () => {
    const secretsStore = new MemorySecretsStore();
    await seedPersistedSession(secretsStore, Date.now() + 3_600_000);
    const hits = countTokenEndpointHits();

    const provider = createOAuthAuthorizationProvider({
      serverId: 'linear-mcp',
      storage,
      secretsStore,
    });
    expect(await provider.resolveHeader()).toBe('Bearer at-persisted');
    expect(await provider.resolveHeader()).toBe('Bearer at-persisted');
    expect(hits()).toBe(0);
  });

  it('refreshes on first resolveHeader() when the persisted session is near expiry', async () => {
    const secretsStore = new MemorySecretsStore();
    await seedPersistedSession(secretsStore, Date.now() + 60_000);
    const hits = countTokenEndpointHits();

    const provider = createOAuthAuthorizationProvider({
      serverId: 'linear-mcp',
      storage,
      secretsStore,
    });
    expect(await provider.resolveHeader()).toBe('Bearer at-rotated');
    expect(hits()).toBe(1);
  });

  it('refresh() still forces a rotation even when the persisted session is fresh', async () => {
    const secretsStore = new MemorySecretsStore();
    await seedPersistedSession(secretsStore, Date.now() + 3_600_000);
    const hits = countTokenEndpointHits();

    const provider = createOAuthAuthorizationProvider({
      serverId: 'linear-mcp',
      storage,
      secretsStore,
    });
    const session = await provider.refresh();
    expect(await session.accessToken.use((v) => v)).toBe('at-rotated');
    expect(hits()).toBe(1);
  });

  it('falls back to a refresh when the fresh record has no resolvable persisted token', async () => {
    const secretsStore = new MemorySecretsStore();
    await seedPersistedSession(secretsStore, Date.now() + 3_600_000);
    await secretsStore.delete('oauth:linear-mcp:access');
    const hits = countTokenEndpointHits();

    const provider = createOAuthAuthorizationProvider({
      serverId: 'linear-mcp',
      storage,
      secretsStore,
    });
    expect(await provider.resolveHeader()).toBe('Bearer at-rotated');
    expect(hits()).toBe(1);
  });
});
