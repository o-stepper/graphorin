import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setDiscoveryFetcherForTesting,
  discoverMetadata,
  fetchAuthorizationServerMetadata,
  OAuthDiscoveryError,
  tryProtectedResourceMetadata,
} from '../../src/oauth/index.js';

import { resetOAuthSubsystem } from './_helpers.js';

describe('@graphorin/security/oauth - discovery', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
  });
  afterEach(() => {
    resetOAuthSubsystem();
  });

  it('fetches authorization-server metadata via /.well-known/oauth-authorization-server', async () => {
    _setDiscoveryFetcherForTesting(async (url) => {
      expect(url).toBe('https://issuer.example.com/.well-known/oauth-authorization-server');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          issuer: 'https://issuer.example.com',
          authorization_endpoint: 'https://issuer.example.com/oauth/authorize',
          token_endpoint: 'https://issuer.example.com/oauth/token',
          registration_endpoint: 'https://issuer.example.com/oauth/register',
          revocation_endpoint: 'https://issuer.example.com/oauth/revoke',
          device_authorization_endpoint: 'https://issuer.example.com/oauth/device',
          code_challenge_methods_supported: ['S256'],
        }),
      };
    });
    const md = await fetchAuthorizationServerMetadata('https://issuer.example.com');
    expect(md.issuer).toBe('https://issuer.example.com');
    expect(md.tokenEndpoint).toBe('https://issuer.example.com/oauth/token');
    expect(md.registrationEndpoint).toBe('https://issuer.example.com/oauth/register');
    expect(md.codeChallengeMethodsSupported).toEqual(['S256']);
  });

  it('falls back to /openid-configuration when the OAuth endpoint is missing', async () => {
    let calls = 0;
    _setDiscoveryFetcherForTesting(async (url) => {
      calls += 1;
      if (url.endsWith('oauth-authorization-server')) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          issuer: 'https://oidc.example.com',
          authorization_endpoint: 'https://oidc.example.com/authorize',
          token_endpoint: 'https://oidc.example.com/token',
        }),
      };
    });
    const md = await fetchAuthorizationServerMetadata('https://oidc.example.com');
    expect(calls).toBe(2);
    expect(md.tokenEndpoint).toBe('https://oidc.example.com/token');
  });

  it('throws OAuthDiscoveryError when no document is reachable', async () => {
    _setDiscoveryFetcherForTesting(async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    }));
    await expect(
      fetchAuthorizationServerMetadata('https://broken.example.com'),
    ).rejects.toBeInstanceOf(OAuthDiscoveryError);
  });

  it('uses RFC 9728 protected-resource metadata when present', async () => {
    const seen: string[] = [];
    _setDiscoveryFetcherForTesting(async (url) => {
      seen.push(url);
      if (url.endsWith('oauth-protected-resource')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            resource: 'https://mcp.example.com',
            authorization_servers: ['https://auth.example.com'],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          issuer: 'https://auth.example.com',
          authorization_endpoint: 'https://auth.example.com/authorize',
          token_endpoint: 'https://auth.example.com/token',
        }),
      };
    });
    const result = await discoverMetadata('https://mcp.example.com');
    expect(result.resource?.authorizationServers).toEqual(['https://auth.example.com']);
    expect(result.server.tokenEndpoint).toBe('https://auth.example.com/token');
    expect(seen[0]).toContain('oauth-protected-resource');
  });

  it('cancels mid-flight when the abort signal fires', async () => {
    const controller = new AbortController();
    _setDiscoveryFetcherForTesting(async () => {
      controller.abort();
      return { ok: true, status: 200, json: async () => ({}) };
    });
    controller.abort();
    await expect(
      tryProtectedResourceMetadata('https://example.com', controller.signal),
    ).rejects.toThrow(/aborted/i);
  });
});

// --- SPL-7 - https-only endpoints, issuer consistency, path-insertion ---------

describe('SPL-7 - discovery hardening', () => {
  beforeEach(() => resetOAuthSubsystem());
  afterEach(() => resetOAuthSubsystem());

  const metadataFor = (issuer: string, endpointOrigin = issuer) => ({
    issuer,
    authorization_endpoint: `${endpointOrigin}/oauth/authorize`,
    token_endpoint: `${endpointOrigin}/oauth/token`,
  });

  it('rejects metadata whose endpoints are plain http on a non-localhost host', async () => {
    _setDiscoveryFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      json: async () => metadataFor('https://issuer.example.com', 'http://evil.example.com'),
    }));
    await expect(
      fetchAuthorizationServerMetadata('https://issuer.example.com'),
    ).rejects.toBeInstanceOf(OAuthDiscoveryError);
  });

  it('allows http endpoints for localhost / 127.0.0.1 (local development)', async () => {
    _setDiscoveryFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      json: async () => metadataFor('http://127.0.0.1:8080'),
    }));
    const metadata = await fetchAuthorizationServerMetadata('http://127.0.0.1:8080');
    expect(metadata.tokenEndpoint).toBe('http://127.0.0.1:8080/oauth/token');
  });

  it('rejects metadata whose issuer does not match the discovery URL (RFC 8414 §3.3)', async () => {
    _setDiscoveryFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      json: async () => metadataFor('https://attacker.example.com'),
    }));
    await expect(
      fetchAuthorizationServerMetadata('https://issuer.example.com'),
    ).rejects.toBeInstanceOf(OAuthDiscoveryError);
  });

  it('builds the well-known URL via RFC 8414 path-insertion for path-bearing issuers', async () => {
    const urls: string[] = [];
    _setDiscoveryFetcherForTesting(async (url) => {
      urls.push(url);
      if (url === 'https://issuer.example.com/.well-known/oauth-authorization-server/tenant-a') {
        return {
          ok: true,
          status: 200,
          json: async () => metadataFor('https://issuer.example.com/tenant-a'),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    const metadata = await fetchAuthorizationServerMetadata('https://issuer.example.com/tenant-a');
    expect(metadata.issuer).toBe('https://issuer.example.com/tenant-a');
    expect(urls[0]).toBe(
      'https://issuer.example.com/.well-known/oauth-authorization-server/tenant-a',
    );
  });
});
