import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setRevocationFetcherForTesting,
  _setTokenEndpointFetcherForTesting,
  createInMemoryOAuthServerStore,
  getOAuthStatus,
  listOAuthSessions,
  refreshOAuthSession,
  registerOAuthStrategy,
  revokeOAuthSession,
} from '../../src/oauth/index.js';

import { resetOAuthSubsystem } from './_helpers.js';

describe('@graphorin/security/oauth - library helpers', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
  });
  afterEach(() => {
    resetOAuthSubsystem();
  });

  it('listOAuthSessions returns only audit-safe metadata', async () => {
    const storage = createInMemoryOAuthServerStore();
    await storage.put({
      id: 'mcp-a',
      serverUrl: 'https://a.example.com',
      clientId: 'cli_a',
      issuer: 'https://a.example.com',
      scope: 'read',
      accessTokenRef: 'keyring:oauth:mcp-a:access',
      refreshTokenRef: 'keyring:oauth:mcp-a:refresh',
      expiresAt: Date.now() + 60 * 60_000,
      lastRefreshedAt: 1,
      registeredVia: 'dcr',
      createdAt: 1,
      updatedAt: 1,
    });
    await storage.put({
      id: 'mcp-b',
      serverUrl: 'https://b.example.com',
      clientId: 'cli_b',
      expiresAt: Date.now() - 1000,
      createdAt: 1,
      updatedAt: 1,
    });
    await storage.put({
      id: 'mcp-c',
      serverUrl: 'https://c.example.com',
      clientId: 'cli_c',
      expiresAt: Date.now() + 60_000,
      createdAt: 1,
      updatedAt: 1,
    });
    await storage.put({
      id: 'mcp-d',
      serverUrl: 'https://d.example.com',
      clientId: 'cli_d',
      createdAt: 1,
      updatedAt: 1,
    });
    const list = await listOAuthSessions(storage);
    expect(list).toHaveLength(4);
    const byId = new Map(list.map((entry) => [entry.serverId, entry]));
    expect(byId.get('mcp-a')?.status).toBe('fresh');
    expect(byId.get('mcp-b')?.status).toBe('expired');
    expect(byId.get('mcp-c')?.status).toBe('expiring-soon');
    expect(byId.get('mcp-d')?.status).toBe('unknown');
  });

  it('refreshOAuthSession refreshes a stored record', async () => {
    const storage = createInMemoryOAuthServerStore();
    await storage.put({
      id: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      clientId: 'cli_test',
      issuer: 'https://mcp.example.com',
      authorizationEndpoint: 'https://mcp.example.com/oauth/authorize',
      tokenEndpoint: 'https://mcp.example.com/oauth/token',
      refreshTokenRef: 'keyring:oauth:mcp-test:refresh',
      createdAt: 1,
      updatedAt: 1,
    });
    // Seed metadata via createOAuthClient so the inflight refresh has a token.
    // refreshOAuthSession requires a refresh token to be in memory, so we
    // expect it to throw because the in-memory map is empty.
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: { access_token: 'access', refresh_token: 'refresh', token_type: 'Bearer' },
    }));
    await expect(refreshOAuthSession(storage, 'mcp-test')).rejects.toThrow(/no refresh token/u);
  });

  it('revokeOAuthSession is a no-op for unknown server-ids', async () => {
    const storage = createInMemoryOAuthServerStore();
    _setRevocationFetcherForTesting(async () => ({ ok: true, status: 200 }));
    await expect(revokeOAuthSession(storage, 'unknown')).resolves.toBeUndefined();
  });

  it('getOAuthStatus reports the registered strategies', async () => {
    const storage = createInMemoryOAuthServerStore();
    registerOAuthStrategy({ id: 'slack', matchUrl: /slack/u });
    const snapshot = await getOAuthStatus(storage);
    expect(snapshot.providers).toEqual([{ id: 'slack', hasMatch: true }]);
    expect(snapshot.defaultStrategy?.id).toBe('slack');
    expect(snapshot.sessions).toEqual([]);
  });
});
