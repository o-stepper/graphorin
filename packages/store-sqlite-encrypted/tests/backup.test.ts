import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { backupEncryptedDatabase, EncryptedBackupLiveWriterError } from '../src/backup.js';
import { _resetCipherPeerCacheForTesting, _setCipherPeerForTesting } from '../src/cipher-peer.js';
import { EncryptSwapLiveWriterError } from '../src/encrypt.js';
import { buildStubDriver, clearStubHistory, getStubHistory } from './_stub-driver.js';

afterEach(() => {
  _resetCipherPeerCacheForTesting();
  clearStubHistory();
});

function setupTempDb(): { dir: string; path: string } {
  const dir = mkdtempSync(join(tmpdir(), 'graphorin-backup-test-'));
  const path = join(dir, 'data.db');
  writeFileSync(
    path,
    `STUB_ENCRYPTED:${JSON.stringify({
      version: 1,
      key: "'pass'",
      cipher: 'sqlcipher',
      attachedFromUnencrypted: false,
      integrity: 'ok',
    })}`,
  );
  return { dir, path };
}

describe('backupEncryptedDatabase (stub driver)', () => {
  it('checkpoints, probes exclusivity, byte-copies and verifies the copy', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { dir, path } = setupTempDb();
    const dest = join(dir, 'backup.db');

    const result = await backupEncryptedDatabase({
      sourcePath: path,
      destPath: dest,
      passphrase: 'pass',
    });
    expect(result.cipher).toBe('sqlcipher');
    expect(result.integrityCheck.ok).toBe(true);
    expect(existsSync(dest)).toBe(true);

    const history = getStubHistory(path);
    expect(history?.pragmas.some((p) => p.includes('wal_checkpoint(TRUNCATE)'))).toBe(true);
    expect(history?.pragmas.some((p) => p.includes('journal_mode = DELETE'))).toBe(true);
    // The probe restores WAL after winning the lock.
    expect(history?.pragmas.some((p) => p.includes('journal_mode = WAL'))).toBe(true);
  });

  it('throws when the source file does not exist', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    await expect(
      backupEncryptedDatabase({
        sourcePath: '/tmp/does-not-exist-graphorin-backup-test.db',
        destPath: '/tmp/irrelevant-backup-dest.db',
        passphrase: 'pass',
      }),
    ).rejects.toThrow(/DB not found/);
  });

  it('refuses a destination equal to the source path', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { path } = setupTempDb();
    await expect(
      backupEncryptedDatabase({ sourcePath: path, destPath: path, passphrase: 'pass' }),
    ).rejects.toThrow(/must differ/);
  });

  it('refuses when WAL sidecars survive the checkpoint close (another holder)', async () => {
    const { Ctor } = buildStubDriver();
    _setCipherPeerForTesting(Ctor as never);
    const { dir, path } = setupTempDb();
    // A sidecar the stub close never removes = a foreign live holder.
    writeFileSync(`${path}-wal`, 'frames');
    await expect(
      backupEncryptedDatabase({
        sourcePath: path,
        destPath: join(dir, 'backup.db'),
        passphrase: 'pass',
      }),
    ).rejects.toBeInstanceOf(EncryptedBackupLiveWriterError);
  });

  it('refuses when the checkpoint reports busy frames (writer racing)', async () => {
    const { Ctor } = buildStubDriver();
    class BusyCheckpoint extends Ctor {
      override pragma(stmt: string, options?: { simple?: boolean }): unknown {
        if (stmt.includes('wal_checkpoint(TRUNCATE)')) {
          return [{ busy: 1, log: 3, checkpointed: 0 }];
        }
        return super.pragma(stmt, options);
      }
    }
    _setCipherPeerForTesting(BusyCheckpoint as never);
    const { dir, path } = setupTempDb();
    await expect(
      backupEncryptedDatabase({
        sourcePath: path,
        destPath: join(dir, 'backup.db'),
        passphrase: 'pass',
      }),
    ).rejects.toBeInstanceOf(EncryptedBackupLiveWriterError);
  });

  it('maps a busy journal-mode probe to the live-writer error', async () => {
    const { Ctor } = buildStubDriver();
    let opens = 0;
    class BusyProbe extends Ctor {
      constructor(path: string) {
        super(path);
        opens += 1;
      }
      override pragma(stmt: string, options?: { simple?: boolean }): unknown {
        // First open = checkpoint connection (untouched); second open =
        // the probe, whose lock switch hits SQLITE_BUSY.
        if (opens > 1 && stmt.includes('journal_mode = DELETE')) {
          throw Object.assign(new Error('database is locked'), { code: 'SQLITE_BUSY' });
        }
        return super.pragma(stmt, options);
      }
    }
    _setCipherPeerForTesting(BusyProbe as never);
    const { dir, path } = setupTempDb();
    await expect(
      backupEncryptedDatabase({
        sourcePath: path,
        destPath: join(dir, 'backup.db'),
        passphrase: 'pass',
      }),
    ).rejects.toBeInstanceOf(EncryptedBackupLiveWriterError);
  });

  it('treats a probe that cannot reach DELETE mode as a live writer', async () => {
    const { Ctor } = buildStubDriver();
    let opens = 0;
    class StuckWal extends Ctor {
      constructor(path: string) {
        super(path);
        opens += 1;
      }
      override pragma(stmt: string, options?: { simple?: boolean }): unknown {
        if (opens > 1 && stmt.includes('journal_mode = DELETE')) {
          return [{ journal_mode: 'wal' }];
        }
        return super.pragma(stmt, options);
      }
    }
    _setCipherPeerForTesting(StuckWal as never);
    const { dir, path } = setupTempDb();
    await expect(
      backupEncryptedDatabase({
        sourcePath: path,
        destPath: join(dir, 'backup.db'),
        passphrase: 'pass',
      }),
    ).rejects.toBeInstanceOf(EncryptedBackupLiveWriterError);
  });

  it('deletes the copy and fails when the post-copy integrity check is red', async () => {
    const { Ctor } = buildStubDriver({ failIntegrity: true });
    _setCipherPeerForTesting(Ctor as never);
    const { dir, path } = setupTempDb();
    const dest = join(dir, 'backup.db');
    await expect(
      backupEncryptedDatabase({ sourcePath: path, destPath: dest, passphrase: 'pass' }),
    ).rejects.toThrow(/post-backup integrity check failed/);
    expect(existsSync(dest)).toBe(false);
  });

  it('the live-writer error family stays catchable via the shared base', () => {
    const err = new EncryptedBackupLiveWriterError('/tmp/x.db');
    expect(err).toBeInstanceOf(EncryptSwapLiveWriterError);
    expect(err.name).toBe('EncryptedBackupLiveWriterError');
    const sidecars = EncryptedBackupLiveWriterError.backupForSidecars('/tmp/x.db', [
      '/tmp/x.db-wal',
    ]);
    expect(sidecars.message).toContain('sidecar');
    const torn = EncryptedBackupLiveWriterError.forConcurrentMutation('/tmp/x.db');
    expect(torn.message).toContain('changed while');
  });
});
