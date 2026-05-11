import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setBrowserOpenerForTesting,
  _setDcrFetcherForTesting,
  _setDiscoveryFetcherForTesting,
  _setRevocationFetcherForTesting,
  _setTokenEndpointFetcherForTesting,
  createInMemoryOAuthServerStore,
  createOAuthClient,
  loginInteractive,
  onOAuthAudit,
  onOAuthLifecycle,
} from '../../src/oauth/index.js';

import { resetOAuthSubsystem } from './_helpers.js';

describe('@graphorin/security/oauth — high-level client', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
    _setDiscoveryFetcherForTesting(async (url) => {
      if (url.endsWith('oauth-protected-resource')) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          issuer: 'https://issuer.example.com',
          authorization_endpoint: 'https://issuer.example.com/oauth/authorize',
          token_endpoint: 'https://issuer.example.com/oauth/token',
          registration_endpoint: 'https://issuer.example.com/oauth/register',
          revocation_endpoint: 'https://issuer.example.com/oauth/revoke',
        }),
      };
    });
    _setDcrFetcherForTesting(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ client_id: 'cli_dcr' }),
    }));
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'read',
      },
    }));
    _setBrowserOpenerForTesting(async (url) => {
      const parsed = new URL(url);
      const redirectUri = parsed.searchParams.get('redirect_uri');
      const state = parsed.searchParams.get('state');
      await fetch(`${redirectUri}?code=auth-1&state=${state}`);
    });
    _setRevocationFetcherForTesting(async () => ({ ok: true, status: 200 }));
  });
  afterEach(() => {
    resetOAuthSubsystem();
  });

  it('drives the end-to-end happy path', async () => {
    const storage = createInMemoryOAuthServerStore();
    const auditEvents: string[] = [];
    const lifecycleEvents: string[] = [];
    onOAuthAudit((event) => auditEvents.push(`${event.action}:${event.decision}`));
    onOAuthLifecycle((event) => lifecycleEvents.push(event.type));

    const result = await loginInteractive({
      serverId: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      storage,
      scope: 'read',
    });
    expect(result.session.accessToken.reveal()).toBe('access-1');
    expect(result.status.serverId).toBe('mcp-test');
    expect(result.status.hasRefreshToken).toBe(true);

    expect(auditEvents).toContain('oauth:registered:success');
    expect(auditEvents).toContain('oauth:granted:success');
    expect(lifecycleEvents).toContain('oauth.granted');

    const stored = await storage.get('mcp-test');
    expect(stored?.refreshTokenRef).toBe('keyring:oauth:mcp-test:refresh');

    // Refresh re-uses the persisted record.
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: {
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'read',
      },
    }));
    const refreshed = await result.client.refresh();
    expect(refreshed.accessToken.reveal()).toBe('access-2');
    expect(auditEvents).toContain('oauth:refreshed:success');
    expect(lifecycleEvents).toContain('oauth.refreshed');

    // Revoke tears the persisted record down.
    await result.client.revoke({ reason: 'user-initiated' });
    expect(await storage.get('mcp-test')).toBeNull();
    expect(auditEvents).toContain('oauth:revoked:success');
    expect(lifecycleEvents).toContain('oauth.revoked');
  });

  it('emits mcp.auth.expired when refresh fails with invalid_grant', async () => {
    const storage = createInMemoryOAuthServerStore();
    await storage.put({
      id: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      clientId: 'cli_test',
      refreshTokenRef: 'keyring:oauth:mcp-test:refresh',
      accessTokenRef: 'keyring:oauth:mcp-test:access',
      createdAt: 1,
      updatedAt: 1,
    });
    const lifecycle: string[] = [];
    onOAuthLifecycle((event) => lifecycle.push(event.type));

    // Seed a session (so the in-memory refresh token is set).
    const client = createOAuthClient({
      serverId: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      storage,
      registration: { clientId: 'cli_test' },
    });
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'Bearer',
        expires_in: 3600,
      },
    }));
    await client.authorizeCode({ scope: 'read', callbackTimeoutMs: 5_000 });
    lifecycle.length = 0;

    _setTokenEndpointFetcherForTesting(async () => ({
      ok: false,
      status: 400,
      body: { error: 'invalid_grant', error_description: 'token revoked' },
    }));
    await expect(client.refresh()).rejects.toThrow();
    expect(lifecycle).toContain('mcp.auth.expired');
  });

  it('reports status', async () => {
    const storage = createInMemoryOAuthServerStore();
    const result = await loginInteractive({
      serverId: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      storage,
      scope: 'read',
    });
    const status = await result.client.status();
    expect(status?.status).toBe('fresh');
  });

  it('exposes registerClient for explicit DCR runs', async () => {
    const storage = createInMemoryOAuthServerStore();
    const client = createOAuthClient({
      serverId: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      storage,
    });
    const result = await client.registerClient({
      clientName: 'graphorin/registered',
      redirectUris: ['http://127.0.0.1:54321/callback'],
      scope: 'read write',
    });
    expect(result.clientId).toBe('cli_dcr');
    expect(client.registration?.clientId).toBe('cli_dcr');
    expect(client.registration?.registeredVia).toBe('dcr');
  });

  it('returns null status when nothing has been persisted', async () => {
    const storage = createInMemoryOAuthServerStore();
    const client = createOAuthClient({
      serverId: 'mcp-empty',
      serverUrl: 'https://mcp.example.com',
      storage,
      registration: { clientId: 'cli_test' },
    });
    expect(await client.status()).toBeNull();
  });

  it('throws when refresh is invoked without a refresh token in memory', async () => {
    const storage = createInMemoryOAuthServerStore();
    await storage.put({
      id: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      clientId: 'cli_test',
      authorizationEndpoint: 'https://issuer.example.com/oauth/authorize',
      tokenEndpoint: 'https://issuer.example.com/oauth/token',
      createdAt: 1,
      updatedAt: 1,
    });
    const client = createOAuthClient({
      serverId: 'mcp-test',
      serverUrl: 'https://mcp.example.com',
      storage,
      registration: { clientId: 'cli_test' },
    });
    await expect(client.refresh()).rejects.toThrow(/no refresh token/u);
  });
});
