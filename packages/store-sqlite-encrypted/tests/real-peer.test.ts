/**
 * CS-7 acceptance: the encrypt → open-with-key → search flow against
 * the REAL `better-sqlite3-multiple-ciphers` peer (no stub). Gated on
 * the native binding being built (it is allow-listed in
 * `pnpm.onlyBuiltDependencies`); skipped with a visible reason when
 * the binding is absent so the suite stays green on exotic platforms.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { backupEncryptedDatabase } from '../src/backup.js';
import { EncryptSwapLiveWriterError, encryptDatabase } from '../src/encrypt.js';
import { rekeyDatabase } from '../src/rekey.js';

async function peerAvailable(): Promise<boolean> {
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

const available = await peerAvailable();

describe.skipIf(!available)('CS-7 - real cipher peer end-to-end', () => {
  it('encrypts a migrated store (FTS rows), rejects keyless opens, searches through the keyed store, and rekeys', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-real-enc-'));
    const plainPath = join(dir, 'data.db');

    // 1. Build a REAL migrated store with an FTS-indexed fact.
    const { createSqliteStore } = await import('@graphorin/store-sqlite');
    const plain = await createSqliteStore({ path: plainPath, skipSqliteVec: true });
    await plain.init();
    await plain.memory.semantic.remember({
      id: 'fact-enc-1',
      kind: 'semantic',
      userId: 'u1',
      sensitivity: 'internal',
      text: 'the vault passphrase rotates quarterly',
      createdAt: new Date().toISOString(),
    } as never);
    const before = await plain.memory.semantic.search(
      { userId: 'u1' },
      { query: 'vault passphrase', topK: 5 },
    );
    expect(before.length).toBeGreaterThan(0);
    await plain.close();

    // 2. Encrypt via the supported copy+rekey path.
    const encPath = join(dir, 'data.enc.db');
    const result = await encryptDatabase({
      sourcePath: plainPath,
      targetPath: encPath,
      passphrase: 'correct horse battery staple',
    });
    expect(result.integrityCheck.ok).toBe(true);

    // 3. A keyless open must NOT read the data.
    const mod = (await import('better-sqlite3-multiple-ciphers')) as {
      default: new (
        path: string,
      ) => {
        prepare(sql: string): { get(): unknown };
        close(): void;
      };
    };
    const noKey = new mod.default(encPath);
    expect(() => noKey.prepare('SELECT count(*) c FROM facts').get()).toThrow();
    noKey.close();

    // 4. The full store opens with the key and FTS search works.
    const enc = await createSqliteStore({
      path: encPath,
      skipSqliteVec: true,
      encryption: {
        enabled: true,
        cipher: 'sqlcipher',
        passphraseResolver: async () => 'correct horse battery staple',
      },
    });
    await enc.init();
    const hits = await enc.memory.semantic.search(
      { userId: 'u1' },
      { query: 'vault passphrase', topK: 5 },
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.record.id).toBe('fact-enc-1');
    await enc.close();

    // 5. Rekey rotates the passphrase without a false post-rekey fail.
    const rekeyed = await rekeyDatabase({
      path: encPath,
      oldPassphrase: 'correct horse battery staple',
      newPassphrase: 'rotated passphrase 2026',
    });
    expect(rekeyed.integrityCheck.ok).toBe(true);

    // Old key no longer opens (the connection itself rejects); new key does.
    await expect(
      createSqliteStore({
        path: encPath,
        skipSqliteVec: true,
        encryption: {
          enabled: true,
          cipher: 'sqlcipher',
          passphraseResolver: async () => 'correct horse battery staple',
        },
      }),
    ).rejects.toThrow(/not a database/);
    const newKey = await createSqliteStore({
      path: encPath,
      skipSqliteVec: true,
      encryption: {
        enabled: true,
        cipher: 'sqlcipher',
        passphraseResolver: async () => 'rotated passphrase 2026',
      },
    });
    await newKey.init();
    const after = await newKey.memory.semantic.search(
      { userId: 'u1' },
      { query: 'vault passphrase', topK: 5 },
    );
    expect(after.length).toBeGreaterThan(0);
    await newKey.close();
  }, 90_000);

  it('chacha20 (the peer default) round-trips too (CS-13)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-real-cha-'));
    const plainPath = join(dir, 'p.db');
    const mod = (await import('better-sqlite3-multiple-ciphers')) as {
      default: new (
        path: string,
      ) => {
        exec(sql: string): void;
        pragma(p: string): unknown;
        prepare(sql: string): { get(): unknown };
        close(): void;
      };
    };
    const plain = new mod.default(plainPath);
    plain.exec('CREATE TABLE t(v TEXT)');
    plain.exec("INSERT INTO t(v) VALUES ('chacha-roundtrip')");
    plain.close();

    const encPath = join(dir, 'p.enc.db');
    const result = await encryptDatabase({
      sourcePath: plainPath,
      targetPath: encPath,
      passphrase: 'k2',
      cipher: 'chacha20',
    });
    expect(result.integrityCheck.ok).toBe(true);

    const enc = new mod.default(encPath);
    enc.pragma("cipher = 'chacha20'");
    enc.pragma("key = 'k2'");
    expect((enc.prepare('SELECT v FROM t').get() as { v: string }).v).toBe('chacha-roundtrip');
    enc.close();
  }, 90_000);
});

describe.skipIf(!available)('W-064 - encrypted parity: incremental auto-vacuum', () => {
  it('a fresh encrypted database created through createEncryptedConnection gets auto_vacuum=2', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-real-enc-av-'));
    const { createEncryptedConnection } = await import('../src/connection.js');
    const conn = await createEncryptedConnection({
      path: join(dir, 'fresh-encrypted.db'),
      skipSqliteVec: true,
      encryption: {
        enabled: true,
        passphraseResolver: async () => 'compact-parity-pw',
      },
    });
    // The delegate adds no pragma sequence of its own - the shared
    // openConnection applies auto_vacuum right after the cipher/key
    // pragmas, so encrypted databases compact exactly like plain ones.
    expect(Number(conn.pragma('auto_vacuum', { simple: true }))).toBe(2);
    conn.close();
  });
});

describe.skipIf(!available)('backupEncryptedDatabase - stopped-server byte copy', () => {
  it('backs up an encrypted store, the copy opens with the key, and a live holder is refused', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-real-encbk-'));
    const plainPath = join(dir, 'data.db');
    const { createSqliteStore } = await import('@graphorin/store-sqlite');
    const plain = await createSqliteStore({ path: plainPath, skipSqliteVec: true });
    await plain.init();
    await plain.memory.semantic.remember({
      id: 'fact-bk-1',
      kind: 'semantic',
      userId: 'u1',
      sensitivity: 'internal',
      text: 'the backup survives the volume wipe',
      createdAt: new Date().toISOString(),
    } as never);
    await plain.close();

    const encPath = join(dir, 'data.enc.db');
    await encryptDatabase({
      sourcePath: plainPath,
      targetPath: encPath,
      passphrase: 'bk-pass',
    });

    // The driver's page-level backup() is exactly what CANNOT work on
    // an encrypted database - this regression probe keeps the reason
    // for the byte-copy path honest. If the driver ever learns keyed
    // backups, this expectation flips and the byte-copy path can go.
    const mod = (await import('better-sqlite3-multiple-ciphers')) as {
      default: new (
        path: string,
      ) => {
        pragma(sql: string): unknown;
        backup(dest: string): Promise<unknown>;
        close(): void;
      };
    };
    const rawKeyed = new mod.default(encPath);
    rawKeyed.pragma("cipher = 'sqlcipher'");
    rawKeyed.pragma('legacy = 4');
    rawKeyed.pragma("key = 'bk-pass'");
    await expect(rawKeyed.backup(join(dir, 'naive.db'))).rejects.toThrow(/not supported/);
    rawKeyed.close();

    const destPath = join(dir, 'backup.db');
    const result = await backupEncryptedDatabase({
      sourcePath: encPath,
      destPath,
      passphrase: 'bk-pass',
    });
    expect(result.integrityCheck.ok).toBe(true);

    // The copy opens with the same key and the data is there.
    const restored = await createSqliteStore({
      path: destPath,
      skipSqliteVec: true,
      encryption: {
        enabled: true,
        cipher: 'sqlcipher',
        passphraseResolver: async () => 'bk-pass',
      },
    });
    await restored.init();
    const hits = await restored.memory.semantic.search(
      { userId: 'u1' },
      { query: 'backup survives', topK: 5 },
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.record.id).toBe('fact-bk-1');
    await restored.close();

    // A live holder must be refused (whichever guard layer fires, the
    // shared live-writer class surfaces).
    const { createEncryptedConnection } = await import('../src/connection.js');
    const holder = await createEncryptedConnection({
      path: encPath,
      skipSqliteVec: true,
      encryption: {
        enabled: true,
        cipher: 'sqlcipher',
        passphraseResolver: async () => 'bk-pass',
      },
    });
    holder.pragma('user_version');
    try {
      await expect(
        backupEncryptedDatabase({
          sourcePath: encPath,
          destPath: join(dir, 'backup2.db'),
          passphrase: 'bk-pass',
        }),
      ).rejects.toBeInstanceOf(EncryptSwapLiveWriterError);
    } finally {
      holder.close();
    }
  }, 90_000);
});
