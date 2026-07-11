import type { OAuthServerStore } from '@graphorin/core/contracts';
import {
  _resetInflightRefreshForTesting,
  _setRevocationFetcherForTesting,
  _setTokenEndpointFetcherForTesting,
  createInMemoryOAuthServerStore,
} from '@graphorin/security/oauth';
import { MemorySecretsStore } from '@graphorin/security/secrets';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  mcpAuthListSessions,
  mcpAuthRefresh,
  mcpAuthRevoke,
  mcpAuthStatus,
} from '../src/oauth/library.js';

// What a previous process persisted after loginInteractive: metadata
// endpoints (no discovery network) plus token refs into the secrets
// store under the SPL-1 scheme-stripped keys.
function persistedRecord(id: string): Parameters<OAuthServerStore['put']>[0] {
  return {
    id,
    serverUrl: 'https://mcp.example.com',
    clientId: 'cli_test',
    issuer: 'https://mcp.example.com',
    authorizationEndpoint: 'https://mcp.example.com/oauth/authorize',
    tokenEndpoint: 'https://mcp.example.com/oauth/token',
    revocationEndpoint: 'https://mcp.example.com/oauth/revoke',
    accessTokenRef: `keyring:oauth:${id}:access`,
    refreshTokenRef: `keyring:oauth:${id}:refresh`,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('library helpers', () => {
  beforeEach(() => {
    _resetInflightRefreshForTesting();
  });

  afterEach(() => {
    _setTokenEndpointFetcherForTesting(null);
    _setRevocationFetcherForTesting(null);
  });

  it('mcpAuthListSessions returns the persisted records', async () => {
    const storage = createInMemoryOAuthServerStore();
    await storage.put({
      id: 'linear-mcp',
      serverUrl: 'https://example.com/mcp',
      clientId: 'abc',
      createdAt: 1,
      updatedAt: 1,
    });
    const sessions = await mcpAuthListSessions(storage);
    expect(sessions.length).toBe(1);
    expect(sessions[0]?.serverId).toBe('linear-mcp');
  });

  it('mcpAuthRefresh rejects when the server is not registered', async () => {
    const storage = createInMemoryOAuthServerStore();
    await expect(mcpAuthRefresh(storage, 'missing')).rejects.toThrow();
  });

  it('mcpAuthRevoke is a no-op when the server is missing', async () => {
    const storage = createInMemoryOAuthServerStore();
    await expect(mcpAuthRevoke(storage, 'missing')).resolves.toBeUndefined();
  });

  it('mcpAuthStatus returns a snapshot with sessions and providers fields', async () => {
    const storage = createInMemoryOAuthServerStore();
    const status = await mcpAuthStatus(storage);
    expect(status.sessions).toBeDefined();
    expect(status.providers).toBeDefined();
  });

  // E-16 (S-18/13): the wrappers dropped `secretsStore`, so refresh
  // always threw ('has no refresh token') and revoke skipped RFC 7009.
  it('mcpAuthRefresh succeeds on a persisted session when a secretsStore is supplied', async () => {
    const storage = createInMemoryOAuthServerStore();
    const secretsStore = new MemorySecretsStore();
    await storage.put(persistedRecord('linear-mcp'));
    await secretsStore.set('oauth:linear-mcp:refresh', 'rt-persisted');
    let tokenEndpointHits = 0;
    _setTokenEndpointFetcherForTesting(async () => {
      tokenEndpointHits += 1;
      return {
        ok: true,
        status: 200,
        body: { access_token: 'at-new', refresh_token: 'rt-rotated', token_type: 'Bearer' },
      };
    });

    const session = await mcpAuthRefresh(storage, 'linear-mcp', { secretsStore });

    expect(tokenEndpointHits).toBe(1);
    expect(await session.accessToken.use((v) => v)).toBe('at-new');
    const rotated = await secretsStore.get('oauth:linear-mcp:refresh');
    expect(await rotated?.use((v) => v)).toBe('rt-rotated');
  });

  it('mcpAuthRevoke fires RFC 7009 for the persisted token when a secretsStore is supplied', async () => {
    const storage = createInMemoryOAuthServerStore();
    const secretsStore = new MemorySecretsStore();
    await storage.put(persistedRecord('linear-mcp'));
    await secretsStore.set('oauth:linear-mcp:refresh', 'rt-persisted');
    const revocations: string[] = [];
    _setRevocationFetcherForTesting(async (_url, init) => {
      revocations.push(init.body);
      return { ok: true, status: 200 };
    });

    await mcpAuthRevoke(storage, 'linear-mcp', { secretsStore });

    expect(revocations.length).toBe(1);
    expect(revocations[0]).toContain('token=rt-persisted');
    expect(await storage.get('linear-mcp')).toBeNull();
    expect(await secretsStore.get('oauth:linear-mcp:refresh')).toBeNull();
  });

  it('mcpAuthListSessions and mcpAuthStatus resolve token presence through the secretsStore', async () => {
    const storage = createInMemoryOAuthServerStore();
    const secretsStore = new MemorySecretsStore();
    await storage.put(persistedRecord('linear-mcp'));
    // Only the refresh token survives in the store: the refs alone
    // must not count as token presence.
    await secretsStore.set('oauth:linear-mcp:refresh', 'rt-persisted');

    const sessions = await mcpAuthListSessions(storage, { secretsStore });
    expect(sessions[0]?.hasAccessToken).toBe(false);
    expect(sessions[0]?.hasRefreshToken).toBe(true);

    const status = await mcpAuthStatus(storage, { secretsStore });
    expect(status.sessions[0]?.hasAccessToken).toBe(false);
    expect(status.sessions[0]?.hasRefreshToken).toBe(true);
  });
});
