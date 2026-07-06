import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CipherPeerMissingError, resolvePassphrase } from '../src/encryption/index.js';

describe('encryption hooks', () => {
  it('passphrase resolver returns SQL-quoted UTF-8 literal', async () => {
    const literal = await resolvePassphrase({
      enabled: true,
      passphraseResolver: async () => "p'word",
    });
    expect(literal).toBe("'p''word'");
  });

  it('passphrase resolver returns hex form for binary keys', async () => {
    const literal = await resolvePassphrase({
      enabled: true,
      passphraseResolver: async () => Buffer.from([0xab, 0xcd, 0xef]),
    });
    expect(literal).toBe("x'abcdef'");
  });

  it('rejects empty resolver result', async () => {
    await expect(
      resolvePassphrase({
        enabled: true,
        passphraseResolver: async () => '',
      }),
    ).rejects.toThrow(/empty/);
  });

  it('rejects empty Buffer resolver result', async () => {
    await expect(
      resolvePassphrase({
        enabled: true,
        passphraseResolver: async () => Buffer.alloc(0),
      }),
    ).rejects.toThrow(/empty/);
  });

  it('CipherPeerMissingError is a typed Error subclass', () => {
    const err = new CipherPeerMissingError('boom');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CipherPeerMissingError');
    expect(err.message).toBe('boom');
  });

  it('createSqliteStore with encryption + driver injection wires the passphrase through', async () => {
    const { createSqliteStore } = await import('../src/index.js');
    const seenPragmas: string[] = [];
    class FakeDriver {
      open = true;
      inTransaction = false;
      tables: Map<string, unknown> = new Map();
      constructor(public readonly path: string) {}
      pragma(stmt: string): unknown {
        seenPragmas.push(stmt);
        if (stmt === 'page_size') return 4096;
        return null;
      }
      exec(): void {}
      prepare() {
        return {
          run: () => ({ changes: 0, lastInsertRowid: 0 }),
          get: () => undefined,
          all: () => [],
          iterate: () => [].values() as IterableIterator<unknown>,
          pluck() {
            return this;
          },
          raw() {
            return this;
          },
          expand() {
            return this;
          },
          bind() {
            return this;
          },
        };
      }
      transaction<T extends (...args: unknown[]) => unknown>(fn: T): T {
        return fn;
      }
      close(): void {
        this.open = false;
      }
      loadExtension(): void {}
    }
    const store = await createSqliteStore({
      path: ':memory:',
      encryption: {
        enabled: true,
        passphraseResolver: async () => 'topsecret',
      },
      driver: FakeDriver as never,
      skipSqliteVec: true,
    });
    expect(seenPragmas).toContain("key = 'topsecret'");
    expect(store.connection.encrypted).toBe(true);
    await store.close();
  });

  it('createSqliteStore with encryption.enabled fails fast when the cipher peer is missing', async () => {
    // Inject a cipher loader that throws CipherPeerMissingError to
    // simulate the cipher peer being absent. The runtime must NOT fall
    // back to the default `better-sqlite3` driver in this case
    // (DEC-129 / ADR-030 - never silently downgrade).
    const { createSqliteStore } = await import('../src/index.js');
    await expect(
      createSqliteStore({
        path: ':memory:',
        skipSqliteVec: true,
        encryption: {
          enabled: true,
          passphraseResolver: async () => 'topsecret',
        },
        cipherLoader: async () => {
          throw new CipherPeerMissingError(
            "[graphorin/store-sqlite] simulated missing peer 'better-sqlite3-multiple-ciphers'.",
          );
        },
      }),
    ).rejects.toBeInstanceOf(CipherPeerMissingError);
  });

  it('openAuditDatabase fails fast when the cipher peer is missing', async () => {
    const { openAuditDatabase } = await import('../src/audit-db.js');
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-audit-missing-'));
    await expect(
      openAuditDatabase({
        path: `${dir}/audit.db`,
        encryption: {
          enabled: true,
          passphraseResolver: async () => 'topsecret',
        },
        cipherLoader: async () => {
          throw new CipherPeerMissingError(
            "[graphorin/store-sqlite] simulated missing peer 'better-sqlite3-multiple-ciphers'.",
          );
        },
      }),
    ).rejects.toBeInstanceOf(CipherPeerMissingError);
  });

  it('W-110: openAuditDatabase pins the cipher BEFORE PRAGMA key (default chacha20)', async () => {
    const { openAuditDatabase } = await import('../src/audit-db.js');
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-audit-cipher-'));
    const pragmas: string[] = [];
    class FakeDriver {
      open = true;
      pragma(stmt: string): unknown {
        pragmas.push(stmt);
        return [];
      }
      exec(): void {}
      prepare(): never {
        throw new Error('not needed');
      }
      close(): void {
        this.open = false;
      }
    }
    const handle = await openAuditDatabase({
      path: `${dir}/audit.db`,
      encryption: { enabled: true, passphraseResolver: async () => 'topsecret' },
      driver: FakeDriver as never,
    });
    handle.close();
    const cipherIdx = pragmas.findIndex((p) => p.startsWith('cipher = '));
    const keyIdx = pragmas.findIndex((p) => p.startsWith('key = '));
    expect(pragmas[cipherIdx]).toBe("cipher = 'chacha20'");
    expect(cipherIdx).toBeGreaterThanOrEqual(0);
    expect(cipherIdx).toBeLessThan(keyIdx);
  });

  it('W-110: an explicit audit cipher is honoured (sqlcipher pins legacy=4 before key)', async () => {
    const { openAuditDatabase } = await import('../src/audit-db.js');
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-audit-cipher2-'));
    const pragmas: string[] = [];
    class FakeDriver {
      open = true;
      pragma(stmt: string): unknown {
        pragmas.push(stmt);
        return [];
      }
      exec(): void {}
      prepare(): never {
        throw new Error('not needed');
      }
      close(): void {
        this.open = false;
      }
    }
    const handle = await openAuditDatabase({
      path: `${dir}/audit.db`,
      encryption: { enabled: true, cipher: 'sqlcipher', passphraseResolver: async () => 'x' },
      driver: FakeDriver as never,
    });
    handle.close();
    const keyIdx = pragmas.findIndex((p) => p.startsWith('key = '));
    expect(pragmas.indexOf("cipher = 'sqlcipher'")).toBeLessThan(keyIdx);
    expect(pragmas.indexOf('legacy = 4')).toBeLessThan(keyIdx);
    expect(pragmas.indexOf("cipher = 'sqlcipher'")).toBeGreaterThanOrEqual(0);
  });

  it('openAuditDatabase rethrows non-cipher errors from the loader', async () => {
    const { openAuditDatabase } = await import('../src/audit-db.js');
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-audit-nonpeer-'));
    await expect(
      openAuditDatabase({
        path: `${dir}/audit.db`,
        encryption: {
          enabled: true,
          passphraseResolver: async () => 'topsecret',
        },
        cipherLoader: async () => {
          throw new Error('disk full');
        },
      }),
    ).rejects.toThrow(/disk full/);
  });

  it('createSqliteStore with encryption + driver injection wires the passphrase through (sanity check)', async () => {
    const { openConnection } = await import('../src/connection.js');
    const calls: string[] = [];
    class FakeDriver {
      open = true;
      inTransaction = false;
      constructor(public readonly path: string) {}
      pragma(stmt: string): unknown {
        calls.push(`pragma:${stmt}`);
        return null;
      }
      exec(): void {}
      prepare() {
        return {
          run: () => ({ changes: 0, lastInsertRowid: 0 }),
          get: () => undefined,
          all: () => [],
          iterate: () => [].values() as IterableIterator<unknown>,
          pluck() {
            return this;
          },
          raw() {
            return this;
          },
          expand() {
            return this;
          },
          bind() {
            return this;
          },
        };
      }
      transaction<T extends (...args: unknown[]) => unknown>(fn: T): T {
        return fn;
      }
      close(): void {
        this.open = false;
      }
      loadExtension(): void {}
    }
    const conn = await openConnection({
      path: ':memory:',
      skipSqliteVec: true,
      driver: FakeDriver as unknown as import('../src/connection.js').BetterSqlite3Constructor,
      encryption: {
        enabled: true,
        passphraseResolver: async () => 'topsecret',
      },
    });
    expect(calls.some((c) => c.startsWith("pragma:key = 'topsecret'"))).toBe(true);
    expect(conn.encrypted).toBe(true);
    conn.close();
  });
});
