import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setRevocationFetcherForTesting,
  _setTokenEndpointFetcherForTesting,
  OAuthFlowAbortedError,
  OAuthRefreshError,
  OAuthRevokedError,
  refreshAccessToken,
  revokeOAuthToken,
} from '../../src/oauth/index.js';
import { SecretValue } from '../../src/secrets/secret-value.js';

import { buildSyntheticServerMetadata, resetOAuthSubsystem } from './_helpers.js';

describe('@graphorin/security/oauth - refresh + revoke', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
  });
  afterEach(() => {
    resetOAuthSubsystem();
  });

  it('refresh debounces concurrent calls per server-id', async () => {
    let calls = 0;
    let resolveExchange!: (value: {
      ok: boolean;
      status: number;
      body: Record<string, unknown>;
    }) => void;
    _setTokenEndpointFetcherForTesting(async () => {
      calls += 1;
      return new Promise((resolve) => {
        resolveExchange = resolve as never;
      });
    });
    const refreshToken = SecretValue.fromString('refresh-1');
    const args = {
      serverId: 'mcp-test',
      metadata: { server: buildSyntheticServerMetadata() },
      registration: { clientId: 'cli_test' },
      refreshToken,
    };
    const promises = Array.from({ length: 10 }, () => refreshAccessToken(args));
    await new Promise((resolve) => setImmediate(resolve));
    expect(calls).toBe(1);
    resolveExchange({
      ok: true,
      status: 200,
      body: {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        token_type: 'Bearer',
        expires_in: 600,
      },
    });
    const sessions = await Promise.all(promises);
    for (const session of sessions) {
      expect(session.accessToken.reveal()).toBe('new-access');
    }
  });

  it('throws OAuthRevokedError on invalid_grant', async () => {
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: false,
      status: 400,
      body: { error: 'invalid_grant', error_description: 'token revoked' },
    }));
    const refreshToken = SecretValue.fromString('refresh-1');
    await expect(
      refreshAccessToken({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        refreshToken,
      }),
    ).rejects.toBeInstanceOf(OAuthRevokedError);
  });

  it('throws OAuthRefreshError for non-revocation errors', async () => {
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: false,
      status: 502,
      body: { error: 'temporarily_unavailable', error_description: 'try later' },
    }));
    const refreshToken = SecretValue.fromString('refresh-1');
    await expect(
      refreshAccessToken({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        refreshToken,
      }),
    ).rejects.toBeInstanceOf(OAuthRefreshError);
  });

  it('revokePreviousOnRotation revokes the old refresh token when the server rotates it', async () => {
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: {
        access_token: 'new-access',
        refresh_token: 'rotated-refresh', // server hands back a NEW refresh token
        token_type: 'Bearer',
        expires_in: 600,
      },
    }));
    let revoked: { token: string; hint?: string } | undefined;
    _setRevocationFetcherForTesting(async (_url, init) => {
      const params = new URLSearchParams(init.body);
      revoked = {
        token: params.get('token') ?? '',
        ...(params.get('token_type_hint') === null
          ? {}
          : { hint: params.get('token_type_hint') as string }),
      };
      return { ok: true, status: 200 };
    });
    const session = await refreshAccessToken({
      serverId: 'mcp-test',
      metadata: {
        server: buildSyntheticServerMetadata({
          revocationEndpoint: 'https://issuer.example.com/oauth/revoke',
        }),
      },
      registration: { clientId: 'cli_test' },
      refreshToken: SecretValue.fromString('old-refresh'),
      revokePreviousOnRotation: true,
    });
    expect(session.refreshToken?.reveal()).toBe('rotated-refresh');
    // The PREVIOUS (old) token is the one revoked, hinted as a refresh_token.
    expect(revoked?.token).toBe('old-refresh');
    expect(revoked?.hint).toBe('refresh_token');
  });

  it('revokePreviousOnRotation does not revoke when the refresh token is unchanged', async () => {
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: {
        access_token: 'new-access',
        refresh_token: 'same-refresh', // server returns the SAME token (no rotation)
        token_type: 'Bearer',
        expires_in: 600,
      },
    }));
    let revokeCalled = false;
    _setRevocationFetcherForTesting(async () => {
      revokeCalled = true;
      return { ok: true, status: 200 };
    });
    await refreshAccessToken({
      serverId: 'mcp-test',
      metadata: {
        server: buildSyntheticServerMetadata({
          revocationEndpoint: 'https://issuer.example.com/oauth/revoke',
        }),
      },
      registration: { clientId: 'cli_test' },
      refreshToken: SecretValue.fromString('same-refresh'),
      revokePreviousOnRotation: true,
    });
    expect(revokeCalled).toBe(false);
  });

  it('revokeOAuthToken posts to the discovered endpoint', async () => {
    let captured: { url: string; body: string } | undefined;
    _setRevocationFetcherForTesting(async (url, init) => {
      captured = { url, body: init.body };
      return { ok: true, status: 200 };
    });
    await revokeOAuthToken({
      serverId: 'mcp-test',
      metadata: {
        server: buildSyntheticServerMetadata({
          revocationEndpoint: 'https://issuer.example.com/oauth/revoke',
        }),
      },
      registration: { clientId: 'cli_test' },
      token: SecretValue.fromString('refresh-1'),
      tokenTypeHint: 'refresh_token',
    });
    expect(captured?.url).toBe('https://issuer.example.com/oauth/revoke');
    const params = new URLSearchParams(captured?.body ?? '');
    expect(params.get('token')).toBe('refresh-1');
    expect(params.get('token_type_hint')).toBe('refresh_token');
  });

  it('revokeOAuthToken THROWS when the endpoint is missing - no silent unconfirmed success (SPL-16)', async () => {
    let called = false;
    _setRevocationFetcherForTesting(async () => {
      called = true;
      return { ok: true, status: 200 };
    });
    await expect(
      revokeOAuthToken({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        token: SecretValue.fromString('refresh-1'),
      }),
    ).rejects.toThrow(/no revocation endpoint/);
    expect(called).toBe(false);
  });

  it('revokeOAuthToken THROWS on a non-2xx revocation response (SPL-16)', async () => {
    _setRevocationFetcherForTesting(async () => ({ ok: false, status: 503 }));
    await expect(
      revokeOAuthToken({
        serverId: 'mcp-test',
        metadata: {
          server: {
            ...buildSyntheticServerMetadata(),
            revocationEndpoint: 'https://mcp.example.com/oauth/revoke',
          },
        },
        registration: { clientId: 'cli_test' },
        token: SecretValue.fromString('refresh-1'),
      }),
    ).rejects.toThrow(/HTTP 503/);
  });

  it('revokeOAuthToken sends Basic auth when a client secret is configured', async () => {
    let captured: { basic?: string } | undefined;
    _setRevocationFetcherForTesting(async (_url, init) => {
      captured = init.basicAuth === undefined ? {} : { basic: init.basicAuth };
      return { ok: true, status: 200 };
    });
    await revokeOAuthToken({
      serverId: 'mcp-test',
      metadata: {
        server: buildSyntheticServerMetadata({
          revocationEndpoint: 'https://issuer.example.com/oauth/revoke',
        }),
      },
      registration: {
        clientId: 'cli_test',
        clientSecret: SecretValue.fromString('shh'),
      },
      token: SecretValue.fromString('refresh-1'),
    });
    expect(captured?.basic).toBeDefined();
  });

  it('refreshAccessToken throws when the abort signal is set before invocation', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      refreshAccessToken({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        refreshToken: SecretValue.fromString('refresh-1'),
        signal: controller.signal,
      }),
    ).rejects.toBeInstanceOf(OAuthFlowAbortedError);
  });

  it('refreshAccessToken includes the previous scope when supplied', async () => {
    let captured: URLSearchParams | undefined;
    _setTokenEndpointFetcherForTesting(async (_url, init) => {
      captured = new URLSearchParams(init.body);
      return {
        ok: true,
        status: 200,
        body: { access_token: 'a', token_type: 'Bearer', refresh_token: 'r' },
      };
    });
    const refreshToken = SecretValue.fromString('refresh-1');
    await refreshAccessToken({
      serverId: 'mcp-test',
      metadata: { server: buildSyntheticServerMetadata() },
      registration: {
        clientId: 'cli_test',
        clientSecret: SecretValue.fromString('shh'),
      },
      refreshToken,
      scope: 'read offline_access',
    });
    expect(captured?.get('scope')).toBe('read offline_access');
  });
});
