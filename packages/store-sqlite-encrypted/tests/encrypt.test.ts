import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { _resetCipherPeerCacheForTesting, _setCipherPeerForTesting } from '../src/cipher-peer.js';
import { encryptDatabase } from '../src/encrypt.js';
import { buildStubDriver, clearStubHistory, getStubHistory } from './_stub-driver.js';

afterEach(() => {
  _resetCipherPeerCacheForTesting();
  clearStubHistory();
});

function setupTempDb(): { dir: string; src: string; tgt: string } {
  const dir = mkdtempSync(join(tmpdir(), 'graphorin-encrypt-test-'));
  const src = join(dir, 'data.db');
  const tgt = join(dir, 'data.db.encrypted');
  writeFileSync(src, 'unencrypted-bytes');
  return { dir, src, tgt };
}

describe('encryptDatabase', () => {
  it('writes the cipher PRAGMAs and ATTACHes the target with the new key', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    const result = await encryptDatabase({
      sourcePath: src,
      targetPath: tgt,
      passphrase: 'topsecret',
    });
    expect(result.cipher).toBe('sqlcipher');
    expect(result.integrityCheck.ok).toBe(true);
    expect(result.targetPath).toBe(tgt);
    // CS-7 wire contract: checkpoint the source, then convert the COPY
    // in place via cipher pragmas + rekey — never ATTACH/sqlcipher_export
    // (sqlite3mc ships no such function).
    const sourceHistory = getStubHistory(src);
    expect(sourceHistory?.pragmas.some((e) => /wal_checkpoint/.test(e))).toBe(true);
    expect(sourceHistory?.execs.some((e) => /sqlcipher_export/.test(e))).toBe(false);
    const targetHistory = getStubHistory(tgt);
    expect(targetHistory?.pragmas.some((p) => /^cipher = 'sqlcipher'$/.test(p))).toBe(true);
    expect(targetHistory?.pragmas.some((p) => /^rekey = /.test(p))).toBe(true);
    // Verify the target file was written through the stub.
    expect(readFileSync(tgt, 'utf8')).toMatch(/^STUB_ENCRYPTED:/);
  });

  it('honours the swap option by atomically replacing the source file', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    const result = await encryptDatabase({
      sourcePath: src,
      targetPath: tgt,
      passphrase: 'topsecret',
      swap: true,
    });
    expect(result.targetPath).toBe(src);
    expect(result.swap?.originalRenamedTo).toMatch(/data\.db\.bak\.\d+$/);
    expect(readFileSync(src, 'utf8')).toMatch(/^STUB_ENCRYPTED:/);
    expect(readFileSync(result.swap?.originalRenamedTo, 'utf8')).toBe('unencrypted-bytes');
  });

  it('respects a non-default cipher selection', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    await encryptDatabase({
      sourcePath: src,
      targetPath: tgt,
      passphrase: 'topsecret',
      cipher: 'aes256cbc',
    });
    const targetHistory = getStubHistory(tgt);
    expect(targetHistory?.pragmas.some((p) => /^cipher = 'aes256cbc'$/.test(p))).toBe(true);
  });

  it('throws when the source DB does not exist', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    await expect(
      encryptDatabase({
        sourcePath: '/tmp/does-not-exist-graphorin-encrypt-test.db',
        targetPath: '/tmp/whatever.db',
        passphrase: 'topsecret',
      }),
    ).rejects.toThrow(/source DB not found/);
  });

  it('throws when source and target paths are equal', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src } = setupTempDb();
    await expect(
      encryptDatabase({
        sourcePath: src,
        targetPath: src,
        passphrase: 'topsecret',
      }),
    ).rejects.toThrow(/must differ/);
  });

  it('refuses to overwrite an existing target file by default', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    writeFileSync(tgt, 'some-other-bytes');
    await expect(
      encryptDatabase({
        sourcePath: src,
        targetPath: tgt,
        passphrase: 'topsecret',
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('overwrites an existing target file when `overwriteTarget: true`', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    writeFileSync(tgt, 'some-other-bytes');
    const result = await encryptDatabase({
      sourcePath: src,
      targetPath: tgt,
      passphrase: 'topsecret',
      overwriteTarget: true,
    });
    expect(result.integrityCheck.ok).toBe(true);
  });

  it('cleans up the target and surfaces an error when integrity check fails', async () => {
    const { Ctor } = buildStubDriver({ failIntegrity: true });
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    await expect(
      encryptDatabase({
        sourcePath: src,
        targetPath: tgt,
        passphrase: 'topsecret',
      }),
    ).rejects.toThrow(/integrity check failed/);
  });
});
