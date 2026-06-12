import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { onOAuthAudit } from '../../src/oauth/audit-emitter.js';
import { createInMemoryOAuthServerStore } from '../../src/oauth/in-memory-store.js';
import {
  getOAuthStatus,
  listOAuthSessions,
  refreshOAuthSession,
  revokeOAuthSession,
} from '../../src/oauth/library.js';
import {
  _resetInflightRefreshForTesting,
  _setRevocationFetcherForTesting,
} from '../../src/oauth/refresh.js';
import { _setTokenEndpointFetcherForTesting } from '../../src/oauth/token-endpoint.js';
import { MemorySecretsStore } from '../../src/secrets/stores/memory.js';

function baseRecord(
  id: string,
): Parameters<ReturnType<typeof createInMemoryOAuthServerStore>['put']>[0] {
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

describe('SPL-1 — OAuth token persistence is real', () => {
  let audits: Array<{ action: string; decision: string; metadata?: Record<string, unknown> }> = [];
  let stopAudit: (() => void) | undefined;

  beforeEach(() => {
    _resetInflightRefreshForTesting();
    audits = [];
    stopAudit = onOAuthAudit((e) =>
      audits.push({
        action: e.action,
        decision: e.decision,
        ...(e.metadata !== undefined ? { metadata: e.metadata as Record<string, unknown> } : {}),
      }),
    );
  });

  afterEach(() => {
    stopAudit?.();
    _setTokenEndpointFetcherForTesting(null);
    _setRevocationFetcherForTesting(null);
  });

  it('a FRESH process (new client) refreshes from the persisted refresh token and re-persists rotation', async () => {
    const storage = createInMemoryOAuthServerStore();
    const secrets = new MemorySecretsStore();
    // What a previous process persisted after loginInteractive.
    await secrets.set('oauth:mcp-p:refresh', 'rt-persisted');
    await storage.put(baseRecord('mcp-p'));

    _setTokenEndpointFetcherForTesting(async () => ({
      ok: true,
      status: 200,
      body: { access_token: 'at-new', refresh_token: 'rt-rotated', token_type: 'Bearer' },
    }));

    const session = await refreshOAuthSession(storage, 'mcp-p', { secretsStore: secrets });
    expect(await session.accessToken.use((v) => v)).toBe('at-new');

    // The rotated tokens were persisted back under the recorded refs.
    const access = await secrets.get('oauth:mcp-p:access');
    const refresh = await secrets.get('oauth:mcp-p:refresh');
    expect(await access?.use((v) => v)).toBe('at-new');
    expect(await refresh?.use((v) => v)).toBe('rt-rotated');
  });

  it('revoke loads the persisted token, calls RFC-7009, deletes the secrets, and audits success only when confirmed', async () => {
    const storage = createInMemoryOAuthServerStore();
    const secrets = new MemorySecretsStore();
    await secrets.set('oauth:mcp-r:access', 'at-1');
    await secrets.set('oauth:mcp-r:refresh', 'rt-1');
    await storage.put(baseRecord('mcp-r'));

    let revoked = 0;
    _setRevocationFetcherForTesting(async () => {
      revoked += 1;
      return { ok: true, status: 200 };
    });

    await revokeOAuthSession(storage, 'mcp-r', { secretsStore: secrets });
    expect(revoked).toBeGreaterThan(0); // the endpoint was actually called
    expect(await secrets.get('oauth:mcp-r:refresh')).toBeNull();
    expect(await secrets.get('oauth:mcp-r:access')).toBeNull();
    expect(await storage.get('mcp-r')).toBeNull();
    const rev = audits.find((a) => a.action === 'oauth:revoked');
    expect(rev?.decision).toBe('success');
  });

  it("an UNCONFIRMED server-side revoke audits 'error' with serverRevoked:false (no success lie) while still tearing down locally", async () => {
    const storage = createInMemoryOAuthServerStore();
    const secrets = new MemorySecretsStore();
    await secrets.set('oauth:mcp-f:refresh', 'rt-1');
    await storage.put(baseRecord('mcp-f'));

    _setRevocationFetcherForTesting(async () => ({ ok: false, status: 503 }));

    await revokeOAuthSession(storage, 'mcp-f', { secretsStore: secrets });
    // Local teardown still happens (documented contract)…
    expect(await storage.get('mcp-f')).toBeNull();
    // …but the audit must not claim a server-side success.
    const rev = audits.find((a) => a.action === 'oauth:revoked');
    expect(rev?.decision).toBe('error');
    expect(rev?.metadata?.serverRevoked).toBe(false);
  });

  it('status/list report hasRefreshToken only when the ref actually resolves', async () => {
    const storage = createInMemoryOAuthServerStore();
    const secrets = new MemorySecretsStore();
    // Record claims refs, but NOTHING is persisted (the phantom-ref case).
    await storage.put(baseRecord('mcp-phantom'));

    const sessions = await listOAuthSessions(storage, { secretsStore: secrets });
    const entry = sessions.find((s) => s.serverId === 'mcp-phantom');
    expect(entry?.hasRefreshToken).toBe(false);
    expect(entry?.hasAccessToken).toBe(false);

    await secrets.set('oauth:mcp-phantom:refresh', 'rt-real');
    const after = await listOAuthSessions(storage, { secretsStore: secrets });
    expect(after.find((s) => s.serverId === 'mcp-phantom')?.hasRefreshToken).toBe(true);

    const status = await getOAuthStatus(storage, { secretsStore: secrets });
    expect(status.sessions.find((s) => s.serverId === 'mcp-phantom')?.hasRefreshToken).toBe(true);
  });
});

describe('SPL-12 / SPL-16 — option + audit honesty', () => {
  it('refresh({force:true}) bypasses the in-flight dedupe', async () => {
    const { refreshAccessToken, _resetInflightRefreshForTesting: reset } = await import(
      '../../src/oauth/refresh.js'
    );
    const { SecretValue } = await import('../../src/secrets/secret-value.js');
    reset();
    let calls = 0;
    _setTokenEndpointFetcherForTesting(async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return {
        ok: true,
        status: 200,
        body: { access_token: `at-${calls}`, token_type: 'Bearer' },
      };
    });
    const args = {
      serverId: 'force-test',
      metadata: {
        server: {
          issuer: 'https://x',
          authorizationEndpoint: 'https://x/a',
          tokenEndpoint: 'https://x/t',
        },
      },
      registration: { clientId: 'c' },
      refreshToken: SecretValue.fromString('rt'),
    };
    // Two concurrent plain calls share one request…
    const [a, b] = await Promise.all([refreshAccessToken(args), refreshAccessToken(args)]);
    expect(calls).toBe(1);
    expect(await a.accessToken.use((v) => v)).toBe(await b.accessToken.use((v) => v));
    // …a forced call issues its own.
    reset();
    const p1 = refreshAccessToken(args);
    const p2 = refreshAccessToken({ ...args, force: true });
    await Promise.all([p1, p2]);
    expect(calls).toBe(3);
  });

  it('EnvSecretsStore read-only set/delete audit as denied, not success (SPL-16)', async () => {
    const { EnvSecretsStore } = await import('../../src/secrets/stores/env.js');
    const { onSecretsAudit } = await import('../../src/secrets/audit-emitter.js');
    const events: Array<{ action: string; decision: string }> = [];
    const stop = onSecretsAudit((e) => events.push({ action: e.action, decision: e.decision }));
    try {
      const store = new EnvSecretsStore();
      await store.set('some-key', 'v');
      await store.delete('some-key');
      const set = events.find((e) => e.action === 'secret:set');
      const del = events.find((e) => e.action === 'secret:delete');
      expect(set?.decision).toBe('denied');
      expect(del?.decision).toBe('denied');
    } finally {
      stop();
    }
  });
});
