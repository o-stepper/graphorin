import type { OAuthServerStore } from '@graphorin/core/contracts';

import {
  _resetInflightRefreshForTesting,
  _resetOAuthLifecycleListenersForTesting,
  _setTokenEndpointFetcherForTesting,
  createInMemoryOAuthServerStore,
  type OAuthLifecycleEvent,
  onOAuthLifecycle,
} from '@graphorin/security/oauth';
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
});
