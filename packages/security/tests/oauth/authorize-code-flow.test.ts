import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setBrowserOpenerForTesting,
  _setTokenEndpointFetcherForTesting,
  OAuthAuthorizationError,
  OAuthCallbackError,
  runAuthorizationCodeFlow,
} from '../../src/oauth/index.js';

import { buildSyntheticServerMetadata, resetOAuthSubsystem } from './_helpers.js';

describe('@graphorin/security/oauth - Authorization Code + PKCE flow', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
  });
  afterEach(() => {
    resetOAuthSubsystem();
  });

  it('completes the flow against a stubbed authorization server', async () => {
    let exchangedParams: URLSearchParams | undefined;
    let openedUrl: string | undefined;
    _setTokenEndpointFetcherForTesting(async (url, init) => {
      void url;
      exchangedParams = new URLSearchParams(init.body);
      return {
        ok: true,
        status: 200,
        body: {
          access_token: 'access-123',
          refresh_token: 'refresh-456',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'read write',
        },
      };
    });
    _setBrowserOpenerForTesting(async (url) => {
      openedUrl = url;
      const parsed = new URL(url);
      const redirectUri = parsed.searchParams.get('redirect_uri');
      const state = parsed.searchParams.get('state');
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      // Hit the callback to satisfy the waiter.
      await fetch(`${redirectUri}?code=auth-code-789&state=${state}`);
    });

    const session = await runAuthorizationCodeFlow({
      serverId: 'mcp-test',
      metadata: { server: buildSyntheticServerMetadata() },
      registration: { clientId: 'cli_test', registeredVia: 'manual' },
      options: { scope: 'read write', callbackTimeoutMs: 10_000 },
    });
    expect(session.accessToken.reveal()).toBe('access-123');
    expect(session.refreshToken?.reveal()).toBe('refresh-456');
    expect(session.scope).toBe('read write');
    expect(openedUrl).toMatch(/code_challenge_method=S256/u);
    expect(exchangedParams?.get('grant_type')).toBe('authorization_code');
    expect(exchangedParams?.get('code')).toBe('auth-code-789');
    expect(exchangedParams?.get('client_id')).toBe('cli_test');
  });

  it('rejects when the returned state does not match the verifier state', async () => {
    _setTokenEndpointFetcherForTesting(async () => {
      throw new Error('token endpoint should not be reached');
    });
    _setBrowserOpenerForTesting(async (url) => {
      const parsed = new URL(url);
      const redirectUri = parsed.searchParams.get('redirect_uri');
      await fetch(`${redirectUri}?code=auth-code&state=tampered`);
    });
    await expect(
      runAuthorizationCodeFlow({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        options: { scope: 'read', callbackTimeoutMs: 5_000 },
      }),
    ).rejects.toBeInstanceOf(OAuthCallbackError);
  });

  it('propagates a token-endpoint error response', async () => {
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: false,
      status: 400,
      body: {
        error: 'invalid_grant',
        error_description: 'authorization code expired',
      },
    }));
    _setBrowserOpenerForTesting(async (url) => {
      const parsed = new URL(url);
      const redirectUri = parsed.searchParams.get('redirect_uri');
      const state = parsed.searchParams.get('state');
      await fetch(`${redirectUri}?code=stale&state=${state}`);
    });
    await expect(
      runAuthorizationCodeFlow({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        options: { callbackTimeoutMs: 5_000 },
      }),
    ).rejects.toBeInstanceOf(OAuthAuthorizationError);
  });

  it('respects the callback timeout', async () => {
    _setTokenEndpointFetcherForTesting(async () => {
      throw new Error('should not exchange');
    });
    _setBrowserOpenerForTesting(async () => {
      // intentionally do nothing
    });
    await expect(
      runAuthorizationCodeFlow({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        options: { callbackTimeoutMs: 75 },
      }),
    ).rejects.toBeInstanceOf(OAuthCallbackError);
  });

  it('cancels the flow when the abort signal fires before bind', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      runAuthorizationCodeFlow({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        options: { signal: controller.signal },
      }),
    ).rejects.toThrow(/aborted/i);
  });
});

// --- SPL-6 - state is REQUIRED on the callback ---------------------------------

describe('SPL-6 - callbacks without state are rejected', () => {
  it('rejects a callback that simply OMITS the state parameter', async () => {
    _setTokenEndpointFetcherForTesting(async () => {
      throw new Error('token endpoint should not be reached');
    });
    _setBrowserOpenerForTesting(async (url) => {
      const parsed = new URL(url);
      const redirectUri = parsed.searchParams.get('redirect_uri');
      // Drive-by request delivering an attacker-chosen code WITHOUT state.
      await fetch(`${redirectUri}?code=attacker-code`);
    });
    await expect(
      runAuthorizationCodeFlow({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        options: { scope: 'read', callbackTimeoutMs: 5_000 },
      }),
    ).rejects.toBeInstanceOf(OAuthCallbackError);
  });
});
