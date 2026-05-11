import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { KeyringSecretsStore, SecretRequiredError } from '../../src/secrets/index.js';

/**
 * Platform-gated integration test for `KeyringSecretsStore`. The test
 * speaks to the host's real OS keychain (`@napi-rs/keyring`) and is
 * therefore opt-in:
 *
 * - The opt-in is `GRAPHORIN_RUN_KEYRING_INTEGRATION=1`.
 * - On platforms where `@napi-rs/keyring` cannot load (no peer
 *   installed, or the underlying backend unavailable — e.g. headless
 *   Linux without a running Secret Service), the test reports an
 *   informative skip rather than failing.
 *
 * Without the opt-in the test always skips so a default `pnpm test`
 * never writes to the developer's actual keychain.
 */

const optedIn = process.env.GRAPHORIN_RUN_KEYRING_INTEGRATION === '1';

const probe = await (async (): Promise<{
  available: boolean;
  reason?: string;
}> => {
  if (!optedIn) {
    return { available: false, reason: 'GRAPHORIN_RUN_KEYRING_INTEGRATION!=1' };
  }
  try {
    const mod = (await import('@napi-rs/keyring')) as { Entry?: unknown };
    if (typeof mod.Entry !== 'function') {
      return { available: false, reason: 'Entry constructor missing in @napi-rs/keyring' };
    }
    return { available: true };
  } catch (err) {
    return { available: false, reason: (err as Error).message };
  }
})();

describe.skipIf(!probe.available)('KeyringSecretsStore — real keyring (platform-gated)', () => {
  // Use a unique service prefix per-run so the test never collides
  // with the developer's other Graphorin deployments.
  const service = `graphorin-test-${randomUUID()}`;
  const store = new KeyringSecretsStore({ service });
  const key = 'integration_secret';
  const raw = `value-${randomUUID()}`;

  it('round-trips a value through the real keychain', async () => {
    await store.set(key, raw);
    try {
      const got = await store.get(key);
      expect(got).not.toBeNull();
      expect(got?.reveal()).toBe(raw);

      const required = await store.require(key);
      expect(required.reveal()).toBe(raw);
    } finally {
      await store.delete(key);
    }
  });

  it('throws SecretRequiredError after delete', async () => {
    await store.set(key, raw);
    await store.delete(key);
    await expect(store.require(key)).rejects.toBeInstanceOf(SecretRequiredError);
  });
});

if (!probe.available) {
  describe('KeyringSecretsStore — real keyring (skipped)', () => {
    it.skip(`platform-gated: ${probe.reason}`, () => {
      // Informative skip — the spec calls for "platform-gated;
      // informative skip on platforms without keyring".
    });
  });
}
