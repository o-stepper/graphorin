import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setDcrFetcherForTesting,
  OAuthRegistrationUnsupportedError,
  registerDynamicClient,
} from '../../src/oauth/index.js';

import { buildSyntheticServerMetadata, resetOAuthSubsystem } from './_helpers.js';

describe('@graphorin/security/oauth — Dynamic Client Registration', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
  });
  afterEach(() => {
    resetOAuthSubsystem();
  });

  it('registers a public client and returns the credentials', async () => {
    const captured: Array<{ url: string; body: string }> = [];
    _setDcrFetcherForTesting(async (url, init) => {
      captured.push({ url, body: init.body });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          client_id: 'cli_abc',
          client_secret: 'shh',
          client_id_issued_at: 1_700_000_000,
          client_secret_expires_at: 0,
          extra: 'opaque',
        }),
      };
    });
    const metadata = {
      server: buildSyntheticServerMetadata({
        registrationEndpoint: 'https://issuer.example.com/oauth/register',
      }),
    };
    const result = await registerDynamicClient(metadata, {
      clientName: 'graphorin/test',
      redirectUris: ['http://127.0.0.1:54321/callback'],
      scope: 'read write',
    });
    expect(result.clientId).toBe('cli_abc');
    expect(result.clientSecret?.reveal()).toBe('shh');
    expect(result.clientIdIssuedAt).toBe(1_700_000_000);
    expect(captured[0]?.url).toBe('https://issuer.example.com/oauth/register');
    const body = JSON.parse(captured[0]?.body ?? '{}') as Record<string, unknown>;
    expect(body.client_name).toBe('graphorin/test');
    expect(body.redirect_uris).toEqual(['http://127.0.0.1:54321/callback']);
    expect(body.scope).toBe('read write');
    expect(body.application_type).toBe('native');
  });

  it('throws when the server does not advertise a registration_endpoint', async () => {
    const metadata = { server: buildSyntheticServerMetadata() };
    await expect(
      registerDynamicClient(metadata, { clientName: 'graphorin/test' }),
    ).rejects.toBeInstanceOf(OAuthRegistrationUnsupportedError);
  });

  it('surfaces a useful error when the registration endpoint returns non-2xx', async () => {
    _setDcrFetcherForTesting(async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({}),
    }));
    const metadata = {
      server: buildSyntheticServerMetadata({
        registrationEndpoint: 'https://issuer.example.com/oauth/register',
      }),
    };
    await expect(registerDynamicClient(metadata, { clientName: 'graphorin/test' })).rejects.toThrow(
      /Dynamic Client Registration failed: 401/u,
    );
  });

  it('respects the abort signal before posting', async () => {
    const controller = new AbortController();
    controller.abort();
    const metadata = {
      server: buildSyntheticServerMetadata({
        registrationEndpoint: 'https://issuer.example.com/oauth/register',
      }),
    };
    await expect(
      registerDynamicClient(metadata, {
        clientName: 'graphorin/test',
        signal: controller.signal,
      }),
    ).rejects.toThrow(/aborted/i);
  });
});
