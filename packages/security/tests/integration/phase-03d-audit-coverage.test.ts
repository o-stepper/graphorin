import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { bridgeOAuthToAudit } from '../../src/audit/oauth-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _setBrowserOpenerForTesting,
  _setDcrFetcherForTesting,
  _setDiscoveryFetcherForTesting,
  _setRevocationFetcherForTesting,
  _setTokenEndpointFetcherForTesting,
  createInMemoryOAuthServerStore,
  createOAuthClient,
  loginInteractive,
} from '../../src/oauth/index.js';

import { createMemoryAuditDb } from '../audit/_helpers.js';
import { resetOAuthSubsystem } from '../oauth/_helpers.js';

/**
 * Phase 03d DoD: every OAuth lifecycle audit action - `oauth:granted`,
 * `oauth:refreshed`, `oauth:revoked`, `oauth:registered`, and
 * `oauth:expired` - must reach the audit log via the Phase 03b
 * `appendAudit` chain. This test exercises a single happy + sad
 * cascade end-to-end and asserts every action shows up in the
 * tamper-evident chain.
 */
describe('phase 03d - audit coverage for every OAuth lifecycle action', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
    _setDiscoveryFetcherForTesting(async (url) => {
      if (url.endsWith('oauth-protected-resource')) {
        // SPL-7: route discovery resource -> AS so the issuer matches its
        // own discovery URL (RFC 8414 §3.3).
        return {
          ok: true,
          status: 200,
          json: async () => ({
            resource: 'https://mcp.example.com',
            authorization_servers: ['https://issuer.example.com'],
          }),
        };
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
    _setBrowserOpenerForTesting(async (url) => {
      const parsed = new URL(url);
      const redirectUri = parsed.searchParams.get('redirect_uri');
      const state = parsed.searchParams.get('state');
      await fetch(`${redirectUri}?code=auth-code&state=${state}`);
    });
    _setRevocationFetcherForTesting(async () => ({ ok: true, status: 200 }));
  });
  afterEach(() => {
    resetOAuthSubsystem();
  });

  it('records oauth:registered, oauth:granted, oauth:refreshed, oauth:expired and oauth:revoked into the chain', async () => {
    const db = createMemoryAuditDb();
    const bridge = bridgeOAuthToAudit({ db });
    try {
      const storage = createInMemoryOAuthServerStore();

      // 1. Granted (also forces DCR → registered).
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
      const result = await loginInteractive({
        serverId: 'mcp-test',
        serverUrl: 'https://mcp.example.com',
        storage,
        scope: 'read',
      });

      // 2. Refreshed.
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
      await result.client.refresh();

      // 3. Expired (refresh failure with invalid_grant). Re-create
      //    the client so the in-memory refresh token survives the
      //    failed attempt above; library refreshOAuthSession recreates
      //    the client on its own which would lose the refresh token.
      _setTokenEndpointFetcherForTesting(async () => ({
        ok: false,
        status: 400,
        body: { error: 'invalid_grant', error_description: 'token revoked' },
      }));
      await expect(result.client.refresh()).rejects.toThrow();

      // 4. Revoked. Reuse the same client so the in-memory token map
      //    still has the revoked token bytes the helper passes to the
      //    revocation endpoint; semantically this is what the CLI
      //    does inside a single session.
      const stillStored = await storage.get('mcp-test');
      expect(stillStored).not.toBeNull();
      const refreshedClient = createOAuthClient({
        serverId: 'mcp-test',
        serverUrl: 'https://mcp.example.com',
        storage,
        registration: { clientId: stillStored?.clientId ?? '' },
        ...(result.client.metadata !== undefined ? { metadata: result.client.metadata } : {}),
      });
      // Seed the client with a fresh session so it has a token to
      // revoke (the previous client's in-memory map is gone with
      // the refreshed client). loginInteractive again - but skip
      // re-registration by reusing the same client_id.
      _setTokenEndpointFetcherForTesting(async () => ({
        ok: true,
        status: 200,
        body: {
          access_token: 'access-3',
          refresh_token: 'refresh-3',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'read',
        },
      }));
      await refreshedClient.authorizeCode({ scope: 'read', callbackTimeoutMs: 5_000 });
      await refreshedClient.revoke({ reason: 'test-cleanup' });

      await bridge.drain();

      // The chain must contain at least one of each action and verify
      // bit-for-bit.
      const verify = await verifyAuditChain(db);
      expect(verify.ok).toBe(true);

      const seenActions = new Set<string>();
      for await (const entry of db.iterate()) {
        seenActions.add(entry.action);
      }
      expect(seenActions.has('oauth:registered')).toBe(true);
      expect(seenActions.has('oauth:granted')).toBe(true);
      expect(seenActions.has('oauth:refreshed')).toBe(true);
      expect(seenActions.has('oauth:expired')).toBe(true);
      expect(seenActions.has('oauth:revoked')).toBe(true);
    } finally {
      bridge();
    }
  });
});
