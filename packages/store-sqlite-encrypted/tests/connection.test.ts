import { afterEach, describe, expect, it } from 'vitest';

import { _resetCipherPeerCacheForTesting, _setCipherPeerForTesting } from '../src/cipher-peer.js';
import { createEncryptedConnection } from '../src/connection.js';
import { buildStubDriver, clearStubHistory, getStubHistory } from './_stub-driver.js';

afterEach(() => {
  _resetCipherPeerCacheForTesting();
  clearStubHistory();
});

describe('createEncryptedConnection', () => {
  it('rejects calls when encryption is disabled', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    await expect(
      createEncryptedConnection({
        path: ':memory:',
        skipSqliteVec: true,
        encryption: { enabled: false },
      }),
    ).rejects.toThrow(/encryption\.enabled: true/);
  });

  it('opens an encrypted in-memory DB and applies the PRAGMA key', async () => {
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
    expect(conn.encrypted).toBe(true);
    const history = getStubHistory(':memory:');
    expect(history?.pragmas).toContain("key = 'topsecret'");
    conn.close();
  });
});
