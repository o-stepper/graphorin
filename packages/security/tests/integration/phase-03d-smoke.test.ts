import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { bridgeOAuthToAudit } from '../../src/audit/oauth-bridge.js';
import { bridgeSupplyChainToAudit } from '../../src/audit/supply-chain-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _setBrowserOpenerForTesting,
  _setDcrFetcherForTesting,
  _setDiscoveryFetcherForTesting,
  _setRevocationFetcherForTesting,
  _setTokenEndpointFetcherForTesting,
  createInMemoryOAuthServerStore,
  loginInteractive,
} from '../../src/oauth/index.js';
import {
  _setPackageManagerForTesting,
  _setPackageManagerRunnerForTesting,
  _setPublicKeyFetcherForTesting,
  installSkillFromNpm,
} from '../../src/supply-chain/index.js';

import { createMemoryAuditDb } from '../audit/_helpers.js';
import { resetOAuthSubsystem } from '../oauth/_helpers.js';
import { buildSignedSkill, resetSupplyChain } from '../supply-chain/_helpers.js';

describe('phase 03d — smoke conformance', () => {
  beforeEach(() => {
    resetOAuthSubsystem();
    resetSupplyChain();
  });
  afterEach(() => {
    resetOAuthSubsystem();
    resetSupplyChain();
  });

  it('OAuth login → token persisted as SecretValue → audit chain verifies (03a + 03b + 03d)', async () => {
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
      json: async () => ({ client_id: 'cli_smoke' }),
    }));
    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: {
        access_token: 'access',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'read',
      },
    }));
    _setBrowserOpenerForTesting(async (url) => {
      const parsed = new URL(url);
      const redirectUri = parsed.searchParams.get('redirect_uri');
      const state = parsed.searchParams.get('state');
      await fetch(`${redirectUri}?code=auth-code&state=${state}`);
    });
    _setRevocationFetcherForTesting(async () => ({ ok: true, status: 200 }));

    const db = createMemoryAuditDb();
    const oauthBridge = bridgeOAuthToAudit({ db });
    try {
      const storage = createInMemoryOAuthServerStore();
      const result = await loginInteractive({
        serverId: 'mcp-smoke',
        serverUrl: 'https://mcp.example.com',
        storage,
        scope: 'read',
      });
      expect(result.session.accessToken.reveal()).toBe('access');
      await oauthBridge.drain();
      const verify = await verifyAuditChain(db);
      expect(verify.ok).toBe(true);
      expect(await db.count()).toBeGreaterThanOrEqual(2);
      // Confirm the persisted record carries SecretRefs only (never
      // the raw token values).
      const stored = await storage.get('mcp-smoke');
      expect(stored?.refreshTokenRef).toBe('keyring:oauth:mcp-smoke:refresh');
      expect(stored?.accessTokenRef).toBe('keyring:oauth:mcp-smoke:access');
    } finally {
      oauthBridge();
    }
  });

  it('Skill install with untrusted trust level enforces signature + ignore-scripts and writes audit (03b + 03d)', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    _setPackageManagerForTesting(() => 'pnpm');
    let invokedArgs: ReadonlyArray<string> = [];
    _setPackageManagerRunnerForTesting(async (args) => {
      invokedArgs = args.args;
      return { exitCode: 0, stdout: '', stderr: '' };
    });

    const db = createMemoryAuditDb();
    const supplyBridge = bridgeSupplyChainToAudit({ db });
    try {
      const status = await installSkillFromNpm({
        packageName: '@vendor/pdf-processing',
        version: '1.2.3',
        skillMd,
      });
      expect(status.signatureVerified).toBe(true);
      expect(invokedArgs).toContain('--ignore-scripts');
      await supplyBridge.drain();
      const verify = await verifyAuditChain(db);
      expect(verify.ok).toBe(true);
      expect(await db.count()).toBe(1);
    } finally {
      supplyBridge();
    }
  });
});
