import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { _resetCipherPeerCacheForTesting, _setCipherPeerForTesting } from '../src/cipher-peer.js';
import { EncryptSwapLiveWriterError, encryptDatabase } from '../src/encrypt.js';
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
    // CS-7 / store-05 wire contract: copy via the driver's ONLINE
    // backup API (consistent under a live writer - the old
    // checkpoint-close-then-copyFileSync silently dropped frames
    // committed in between), then convert the COPY in place via cipher
    // pragmas + rekey - never ATTACH/sqlcipher_export (sqlite3mc ships
    // no such function).
    const sourceHistory = getStubHistory(src);
    expect(sourceHistory?.pragmas.some((e) => /wal_checkpoint/.test(e))).toBe(false);
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
    expect(readFileSync(result.swap?.originalRenamedTo ?? '', 'utf8')).toBe('unencrypted-bytes');
  });

  it('W-012: swap refuses when the source is held by another connection - before any rename', async () => {
    const { Ctor } = buildStubDriver();
    const { src, tgt } = setupTempDb();
    // Emulate the real sqlite3mc behavior: a journal-mode switch on a
    // database another connection holds fails with "database is locked".
    class BusySourceCtor extends (Ctor as new (
      path: string,
      o?: unknown,
    ) => InstanceType<typeof Ctor>) {
      override pragma(stmt: string, o?: { simple?: boolean }): unknown {
        if (/journal_mode\s*=\s*DELETE/.test(stmt) && this.path === src) {
          const err = new Error('database is locked') as Error & { code: string };
          err.code = 'SQLITE_BUSY';
          throw err;
        }
        return super.pragma(stmt, o);
      }
    }
    _setCipherPeerForTesting(BusySourceCtor as never);
    await expect(
      encryptDatabase({ sourcePath: src, targetPath: tgt, passphrase: 'topsecret', swap: true }),
    ).rejects.toThrow(EncryptSwapLiveWriterError);
    // The source was NOT renamed and still carries the plaintext bytes.
    expect(readFileSync(src, 'utf8')).toBe('unencrypted-bytes');
  });

  it('W-012: the probe restores WAL mode and runs ONLY on the swap path', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    await encryptDatabase({ sourcePath: src, targetPath: tgt, passphrase: 'topsecret' });
    // swap: false - no probe pragmas on the source.
    const noSwapHistory = getStubHistory(src);
    expect(noSwapHistory?.pragmas.some((p) => /journal_mode/.test(p))).toBe(false);
  });

  it('W-012: on the swap path the probe switches DELETE then restores WAL - twice (pre-copy and pre-rename)', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    await encryptDatabase({ sourcePath: src, targetPath: tgt, passphrase: 'x', swap: true });
    // src was renamed by the swap; its history bucket keeps the probe trace.
    const history = getStubHistory(src);
    const journalPragmas = (history?.pragmas ?? []).filter((p) => /journal_mode/.test(p));
    // deep-retest-0.13.10 P0: the probe runs once before the copy and
    // again immediately before the rename pair.
    expect(journalPragmas).toHaveLength(4);
    expect(journalPragmas[0]).toMatch(/DELETE/);
    expect(journalPragmas[1]).toMatch(/WAL/);
    expect(journalPragmas[2]).toMatch(/DELETE/);
    expect(journalPragmas[3]).toMatch(/WAL/);
  });

  it('deep-retest-0.13.10 P0: swap refuses when the journal-mode switch is refused SILENTLY (cross-driver holder)', async () => {
    const { Ctor } = buildStubDriver();
    const { src, tgt } = setupTempDb();
    // A holder linked against a DIFFERENT SQLite build does not raise
    // "database is locked" - the pragma just returns 'wal' unchanged.
    class SilentWalCtor extends (Ctor as new (
      path: string,
      o?: unknown,
    ) => InstanceType<typeof Ctor>) {
      override pragma(stmt: string, o?: { simple?: boolean }): unknown {
        if (/journal_mode\s*=\s*DELETE/.test(stmt) && this.path === src) {
          return o?.simple === true ? 'wal' : [{ journal_mode: 'wal' }];
        }
        return super.pragma(stmt, o);
      }
    }
    _setCipherPeerForTesting(SilentWalCtor as never);
    await expect(
      encryptDatabase({ sourcePath: src, targetPath: tgt, passphrase: 'topsecret', swap: true }),
    ).rejects.toThrow(EncryptSwapLiveWriterError);
    // Nothing was renamed and nothing encrypted was left behind.
    expect(readFileSync(src, 'utf8')).toBe('unencrypted-bytes');
    expect(existsSync(tgt)).toBe(false);
  });

  it('deep-retest-0.13.10 P0: a writer appearing between the copy and the rename aborts the swap and cleans the target', async () => {
    const { Ctor } = buildStubDriver();
    const { src, tgt } = setupTempDb();
    // First probe passes; the second (pre-rename) sees a live holder.
    let probeCalls = 0;
    class LateWriterCtor extends (Ctor as new (
      path: string,
      o?: unknown,
    ) => InstanceType<typeof Ctor>) {
      override pragma(stmt: string, o?: { simple?: boolean }): unknown {
        if (/journal_mode\s*=\s*DELETE/.test(stmt) && this.path === src) {
          probeCalls += 1;
          if (probeCalls > 1) {
            return o?.simple === true ? 'wal' : [{ journal_mode: 'wal' }];
          }
        }
        return super.pragma(stmt, o);
      }
    }
    _setCipherPeerForTesting(LateWriterCtor as never);
    await expect(
      encryptDatabase({ sourcePath: src, targetPath: tgt, passphrase: 'topsecret', swap: true }),
    ).rejects.toThrow(EncryptSwapLiveWriterError);
    expect(probeCalls).toBe(2);
    // The source is untouched and the orphaned encrypted copy is gone.
    expect(readFileSync(src, 'utf8')).toBe('unencrypted-bytes');
    expect(existsSync(tgt)).toBe(false);
  });

  it('deep-retest-0.13.10 P0: pre-existing WAL sidecars refuse the swap (live holder or unclean shutdown)', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { src, tgt } = setupTempDb();
    writeFileSync(`${src}-wal`, 'stale-wal-frames');
    await expect(
      encryptDatabase({ sourcePath: src, targetPath: tgt, passphrase: 'topsecret', swap: true }),
    ).rejects.toThrow(/sidecar file\(s\) present/);
    // Refused before ANY connection opened: the probe never ran.
    const history = getStubHistory(src);
    expect(history?.pragmas.some((p) => /journal_mode/.test(p)) ?? false).toBe(false);
    expect(readFileSync(src, 'utf8')).toBe('unencrypted-bytes');
    expect(existsSync(tgt)).toBe(false);
  });

  it('deep-retest-0.13.10 P0: a sidecar appearing inside the check-to-rename window still moves with the backup', async () => {
    const { Ctor } = buildStubDriver();
    const { src, tgt } = setupTempDb();
    // Create the sidecar DURING the second probe's WAL restore - after
    // the sidecar existence check, right before the rename pair.
    let walRestores = 0;
    class LateSidecarCtor extends (Ctor as new (
      path: string,
      o?: unknown,
    ) => InstanceType<typeof Ctor>) {
      override pragma(stmt: string, o?: { simple?: boolean }): unknown {
        const out = super.pragma(stmt, o);
        if (/journal_mode\s*=\s*WAL/.test(stmt) && this.path === src) {
          walRestores += 1;
          if (walRestores === 2) writeFileSync(`${src}-wal`, 'late-wal-frames');
        }
        return out;
      }
    }
    _setCipherPeerForTesting(LateSidecarCtor as never);
    const result = await encryptDatabase({
      sourcePath: src,
      targetPath: tgt,
      passphrase: 'topsecret',
      swap: true,
    });
    const bak = result.swap?.originalRenamedTo ?? '';
    // The race-window net: the sidecar followed the backup, so the new
    // encrypted file at the source path never sees a foreign -wal and
    // any frames inside it stay recoverable next to the backup.
    expect(readFileSync(`${bak}-wal`, 'utf8')).toBe('late-wal-frames');
    expect(existsSync(`${src}-wal`)).toBe(false);
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
