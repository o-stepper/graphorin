import { afterEach, describe, expect, it } from 'vitest';

import { _resetCipherPeerCacheForTesting, _setCipherPeerForTesting } from '../src/cipher-peer.js';
import { createEncryptedConnection } from '../src/connection.js';
import { cipherIntegrityCheck } from '../src/integrity-check.js';
import { buildStubDriver, clearStubHistory } from './_stub-driver.js';

afterEach(() => {
  _resetCipherPeerCacheForTesting();
  clearStubHistory();
});

describe('cipherIntegrityCheck', () => {
  it('returns ok=true for a healthy DB', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const conn = await createEncryptedConnection({
      path: ':memory:',
      skipSqliteVec: true,
      encryption: {
        enabled: true,
        passphraseResolver: async () => 'topsecret',
      },
    });
    const result = cipherIntegrityCheck(conn);
    expect(result.ok).toBe(true);
    expect(result.rows).toEqual(['ok']);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    conn.close();
  });

  it('returns ok=false when the integrity check reports a bad page', async () => {
    const { Ctor } = buildStubDriver({ failIntegrity: true });
    _setCipherPeerForTesting(Ctor as never);
    const conn = await createEncryptedConnection({
      path: ':memory:',
      skipSqliteVec: true,
      encryption: {
        enabled: true,
        passphraseResolver: async () => 'topsecret',
      },
    });
    const result = cipherIntegrityCheck(conn);
    expect(result.ok).toBe(false);
    expect(result.rows[0]).toMatch(/bad hmac/);
    conn.close();
  });
});
