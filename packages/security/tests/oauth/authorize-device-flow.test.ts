import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setDeviceAuthFetcherForTesting,
  _setTokenEndpointFetcherForTesting,
  OAuthAuthorizationError,
  runDeviceAuthorizationFlow,
} from '../../src/oauth/index.js';

import { buildSyntheticServerMetadata, resetOAuthSubsystem } from './_helpers.js';

describe('@graphorin/security/oauth - Device Authorization Grant', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
  });
  afterEach(() => {
    resetOAuthSubsystem();
  });

  it('emits the user code and resolves once the device is authorized', async () => {
    _setDeviceAuthFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        device_code: 'device-1',
        user_code: 'ABCD-EFGH',
        verification_uri: 'https://issuer.example.com/device',
        verification_uri_complete: 'https://issuer.example.com/device?user_code=ABCD-EFGH',
        expires_in: 60,
        interval: 1,
      }),
    }));
    let polls = 0;
    _setTokenEndpointFetcherForTesting(async () => {
      polls += 1;
      if (polls < 2) {
        return { ok: true, status: 200, body: { error: 'authorization_pending' } };
      }
      return {
        ok: true,
        status: 200,
        body: {
          access_token: 'access-1',
          refresh_token: 'refresh-1',
          token_type: 'Bearer',
          expires_in: 600,
          scope: 'read',
        },
      };
    });

    let userCodeInfo: { userCode: string; verificationUri: string } | undefined;
    const session = await runDeviceAuthorizationFlow({
      serverId: 'mcp-test',
      metadata: {
        server: buildSyntheticServerMetadata({
          deviceAuthorizationEndpoint: 'https://issuer.example.com/oauth/device',
        }),
      },
      registration: { clientId: 'cli_test' },
      options: {
        scope: 'read',
        onUserCode: (info) => {
          userCodeInfo = info;
        },
      },
      sleep: async () => undefined,
    });
    expect(userCodeInfo?.userCode).toBe('ABCD-EFGH');
    expect(userCodeInfo?.verificationUri).toBe('https://issuer.example.com/device');
    expect(session.accessToken.reveal()).toBe('access-1');
    expect(polls).toBe(2);
  });

  it('honors slow_down by extending the polling interval', async () => {
    _setDeviceAuthFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        device_code: 'device-2',
        user_code: 'WXYZ',
        verification_uri: 'https://issuer.example.com/device',
        expires_in: 60,
        interval: 1,
      }),
    }));
    const intervalsObserved: number[] = [];
    let polls = 0;
    _setTokenEndpointFetcherForTesting(async () => {
      polls += 1;
      if (polls === 1) return { ok: true, status: 200, body: { error: 'slow_down' } };
      return {
        ok: true,
        status: 200,
        body: {
          access_token: 'access-2',
          token_type: 'Bearer',
          expires_in: 60,
        },
      };
    });
    await runDeviceAuthorizationFlow({
      serverId: 'mcp-test',
      metadata: {
        server: buildSyntheticServerMetadata({
          deviceAuthorizationEndpoint: 'https://issuer.example.com/oauth/device',
        }),
      },
      registration: { clientId: 'cli_test' },
      options: {},
      sleep: async (ms) => {
        intervalsObserved.push(ms);
      },
    });
    expect(intervalsObserved[0]).toBe(1000);
    expect(intervalsObserved[1]).toBe(6000);
  });

  it('throws when the server omits the device endpoint', async () => {
    await expect(
      runDeviceAuthorizationFlow({
        serverId: 'mcp-test',
        metadata: { server: buildSyntheticServerMetadata() },
        registration: { clientId: 'cli_test' },
        options: {},
        sleep: async () => undefined,
      }),
    ).rejects.toBeInstanceOf(OAuthAuthorizationError);
  });

  it('OAUTH-ADV-02: preserves the RFC 8628 spec error from a device-authorization failure', async () => {
    _setDeviceAuthFetcherForTesting(async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'invalid_scope', error_description: 'unknown scope xyz' }),
    }));
    const err = await runDeviceAuthorizationFlow({
      serverId: 'mcp-test',
      metadata: {
        server: buildSyntheticServerMetadata({
          deviceAuthorizationEndpoint: 'https://issuer.example.com/device_authorization',
        }),
      },
      registration: { clientId: 'cli_test' },
      options: { scope: 'xyz' },
      sleep: async () => undefined,
    }).then(
      () => {
        throw new Error('expected a throw');
      },
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(OAuthAuthorizationError);
    const authErr = err as OAuthAuthorizationError;
    // The generic 'device_authorization_failed' must NOT mask the spec code.
    expect(authErr.oauthError).toBe('invalid_scope');
    expect(authErr.oauthErrorDescription).toBe('unknown scope xyz');
  });

  it('cancels mid-poll when the abort signal fires', async () => {
    _setDeviceAuthFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        device_code: 'device-3',
        user_code: 'ABCD',
        verification_uri: 'https://issuer.example.com/device',
        expires_in: 60,
        interval: 1,
      }),
    }));
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: { error: 'authorization_pending' },
    }));
    const controller = new AbortController();
    let polls = 0;
    const promise = runDeviceAuthorizationFlow({
      serverId: 'mcp-test',
      metadata: {
        server: buildSyntheticServerMetadata({
          deviceAuthorizationEndpoint: 'https://issuer.example.com/oauth/device',
        }),
      },
      registration: { clientId: 'cli_test' },
      options: { signal: controller.signal },
      sleep: async () => {
        polls += 1;
        if (polls === 1) controller.abort();
      },
    });
    await expect(promise).rejects.toThrow(/aborted/i);
  });
});
