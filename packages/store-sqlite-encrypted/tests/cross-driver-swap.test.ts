/**
 * deep-retest-0.13.10 P0: `encryptDatabase({ swap: true })` must stay
 * fail-closed when the live holder runs a DIFFERENT SQLite build than
 * the cipher peer - the exact production shape: the server links plain
 * `better-sqlite3`, the migration runs `better-sqlite3-multiple-ciphers`.
 *
 * In that pairing a refused WAL->DELETE switch raises NO exception:
 * the pragma silently returns 'wal'. The original probe trusted the
 * absence of a throw, so the swap proceeded, the live writer's next
 * COMMIT landed in an orphaned `-wal` file, and the row was
 * recoverable from neither the backup nor the encrypted replacement.
 * These tests drive the runner with both REAL native drivers; they
 * skip (visibly) when either native binding is absent.
 */

import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { _resetCipherPeerCacheForTesting } from '../src/cipher-peer.js';
import { createEncryptedConnection } from '../src/connection.js';
import { EncryptSwapLiveWriterError, encryptDatabase } from '../src/encrypt.js';

interface PlainDriverInstance {
  exec(sql: string): void;
  pragma(stmt: string, options?: { simple?: boolean }): unknown;
  prepare(sql: string): { get(): unknown; run(...args: ReadonlyArray<unknown>): unknown };
  close(): void;
}

type PlainDriverCtor = new (path: string) => PlainDriverInstance;

async function loadPlainDriver(): Promise<PlainDriverCtor | null> {
  try {
    const mod = (await import('better-sqlite3')) as { default: PlainDriverCtor };
    const probe = new mod.default(':memory:');
    probe.close();
    return mod.default;
  } catch {
    return null;
  }
}

async function cipherPeerAvailable(): Promise<boolean> {
  try {
    const mod = (await import('better-sqlite3-multiple-ciphers')) as {
      default: new (path: string) => { close(): void };
    };
    const probe = new mod.default(':memory:');
    probe.close();
    return true;
  } catch {
    return false;
  }
}

const PlainDriver = await loadPlainDriver();
const available = PlainDriver !== null && (await cipherPeerAvailable());

describe.skipIf(!available)('deep-retest-0.13.10 P0 - cross-driver live-writer swap', () => {
  const Driver = PlainDriver as PlainDriverCtor;

  function makePlainDb(dir: string): string {
    const path = join(dir, 'data.db');
    const db = new Driver(path);
    db.pragma('journal_mode = WAL');
    db.exec("CREATE TABLE t (value TEXT); INSERT INTO t VALUES ('committed')");
    db.close();
    return path;
  }

  it('refuses the swap while a plain better-sqlite3 writer holds an open transaction', async () => {
    _resetCipherPeerCacheForTesting();
    const dir = mkdtempSync(join(tmpdir(), 'graphorin-xdrv-swap-'));
    const src = makePlainDb(dir);
    const writer = new Driver(src);
    try {
      writer.exec("BEGIN IMMEDIATE; INSERT INTO t VALUES ('pending')");
      await expect(
        encryptDatabase({
          sourcePath: src,
          targetPath: join(dir, 'data.enc.db'),
          passphrase: 'topsecret',
          swap: true,
        }),
      ).rejects.toThrow(EncryptSwapLiveWriterError);
      // Nothing was renamed; the writer's world is intact and the
      // transaction still commits into the ORIGINAL file.
      expect(readdirSync(dir).filter((f) => f.includes('.bak.'))).toHaveLength(0);
      writer.exec('COMMIT');
      const rows = writer.prepare('SELECT COUNT(*) AS n FROM t').get() as { n: number };
      expect(rows.n).toBe(2);
    } finally {
      writer.close();
    }
  });

  it('refuses the swap while an idle cross-driver connection is open (read-only use, no active transaction)', async () => {
    _resetCipherPeerCacheForTesting();
    const dir = mkdtempSync(join(tmpdir(), 'graphorin-xdrv-idle-'));
    const src = makePlainDb(dir);
    const holder = new Driver(src);
    try {
      // A single completed read is enough: it materializes the WAL
      // sidecars, which stay on disk for the connection's lifetime.
      // (fcntl locks never conflict inside one process, and the two
      // drivers embed separate SQLite builds - the sidecar layer is
      // what catches this holder, not the lock probe.)
      holder.prepare('SELECT COUNT(*) AS n FROM t').get();
      await expect(
        encryptDatabase({
          sourcePath: src,
          targetPath: join(dir, 'data.enc.db'),
          passphrase: 'topsecret',
          swap: true,
        }),
      ).rejects.toThrow(EncryptSwapLiveWriterError);
      expect(readdirSync(dir).filter((f) => f.includes('.bak.'))).toHaveLength(0);
    } finally {
      holder.close();
    }
  });

  it('refuses the swap when a crashed holder left stale WAL sidecars behind', async () => {
    _resetCipherPeerCacheForTesting();
    const dir = mkdtempSync(join(tmpdir(), 'graphorin-xdrv-stale-'));
    const src = makePlainDb(dir);
    // Simulate an unclean shutdown: sidecars present, no live holder.
    writeFileSync(`${src}-wal`, Buffer.alloc(0));
    await expect(
      encryptDatabase({
        sourcePath: src,
        targetPath: join(dir, 'data.enc.db'),
        passphrase: 'topsecret',
        swap: true,
      }),
    ).rejects.toThrow(/sidecar file\(s\) present/);
    expect(readdirSync(dir).filter((f) => f.includes('.bak.'))).toHaveLength(0);
  });

  it('swaps cleanly once every connection is closed and moves stale WAL sidecars with the backup', async () => {
    _resetCipherPeerCacheForTesting();
    const dir = mkdtempSync(join(tmpdir(), 'graphorin-xdrv-clean-'));
    const src = makePlainDb(dir);
    const result = await encryptDatabase({
      sourcePath: src,
      targetPath: join(dir, 'data.enc.db'),
      passphrase: 'topsecret',
      swap: true,
    });
    const bak = result.swap?.originalRenamedTo ?? '';
    expect(bak).toMatch(/\.bak\.\d+$/);
    expect(existsSync(bak)).toBe(true);
    // The encrypted replacement sits at the source path and must not
    // share the directory with a stale plaintext -wal.
    expect(existsSync(`${src}-wal`)).toBe(false);
    // Keyed open + row survives (through the package's own opener,
    // which applies the full cipher pragma sequence).
    const conn = await createEncryptedConnection({
      path: src,
      skipSqliteVec: true,
      disableWalHardening: true,
      encryption: {
        enabled: true,
        cipher: 'sqlcipher',
        passphraseResolver: async () => 'topsecret',
      },
    });
    try {
      const rows = conn.prepare('SELECT COUNT(*) AS n FROM t').get() as { n: number };
      expect(rows.n).toBe(1);
    } finally {
      conn.close();
    }
    // The plain driver can no longer open it without a key.
    const reopened = new Driver(src);
    try {
      expect(() => reopened.prepare('SELECT COUNT(*) AS n FROM t').get()).toThrow();
    } finally {
      reopened.close();
    }
  });
});
