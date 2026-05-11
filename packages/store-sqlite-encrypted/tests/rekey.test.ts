import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { _resetCipherPeerCacheForTesting, _setCipherPeerForTesting } from '../src/cipher-peer.js';
import { rekeyDatabase } from '../src/rekey.js';
import { buildStubDriver, clearStubHistory, getStubHistory } from './_stub-driver.js';

afterEach(() => {
  _resetCipherPeerCacheForTesting();
  clearStubHistory();
});

function setupTempDb(): string {
  const dir = mkdtempSync(join(tmpdir(), 'graphorin-rekey-test-'));
  const path = join(dir, 'data.db');
  writeFileSync(path, 'STUB_ENCRYPTED:placeholder');
  return path;
}

describe('rekeyDatabase', () => {
  it('issues `PRAGMA rekey = ...` against the open connection', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const path = setupTempDb();
    const result = await rekeyDatabase({
      path,
      oldPassphrase: 'oldpass',
      newPassphrase: 'newpass',
    });
    expect(result.cipher).toBe('sqlcipher');
    expect(result.integrityCheck.ok).toBe(true);
    const history = getStubHistory(path);
    expect(history?.pragmas).toContain("key = 'oldpass'");
    expect(history?.pragmas).toContain("rekey = 'newpass'");
  });

  it('throws when the file does not exist', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    await expect(
      rekeyDatabase({
        path: '/tmp/does-not-exist-graphorin-rekey-test.db',
        oldPassphrase: 'oldpass',
        newPassphrase: 'newpass',
      }),
    ).rejects.toThrow(/DB not found/);
  });

  it('returns the cipher selection passed by the caller', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const path = setupTempDb();
    const result = await rekeyDatabase({
      path,
      oldPassphrase: 'oldpass',
      newPassphrase: 'newpass',
      cipher: 'aes256cbc',
    });
    expect(result.cipher).toBe('aes256cbc');
  });
});
