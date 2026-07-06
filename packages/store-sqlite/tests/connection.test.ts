import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  openConnection,
  readPragma,
  readWalSize,
  SqliteBusyError,
  WAL_HARDENING_PRAGMAS,
  WalCheckpointManager,
} from '../src/connection.js';
import { checkFtsIntegrity } from '../src/fts-integrity.js';
import { createSqliteStore } from '../src/index.js';

describe('openConnection', () => {
  it(':memory: opens without sqlite-vec and without WAL', async () => {
    const conn = await openConnection({
      path: ':memory:',
      skipSqliteVec: true,
    });
    expect(conn.path).toBe(':memory:');
    expect(conn.encrypted).toBe(false);
    expect(conn.inMemory).toBe(true);
    expect(readPragma(conn, 'foreign_keys')).toBe(1);
    conn.close();
  });

  it('applies every WAL hardening pragma to a file-backed DB', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-'));
    const path = `${dir}/wal.db`;
    const conn = await openConnection({
      path,
      skipSqliteVec: true,
    });
    expect(readPragma(conn, 'journal_mode')).toBe('wal');
    expect(readPragma(conn, 'synchronous')).toBe(1); // NORMAL
    expect(readPragma(conn, 'foreign_keys')).toBe(1);
    expect(readPragma(conn, 'busy_timeout')).toBe(5000);
    expect(readPragma(conn, 'cache_size')).toBe(-64000);
    expect(readPragma(conn, 'temp_store')).toBe(2); // MEMORY
    conn.close();
    expect(WAL_HARDENING_PRAGMAS.length).toBeGreaterThanOrEqual(7);
  });

  it('runs a simple statement through the prepared-statement helpers', async () => {
    const conn = await openConnection({ path: ':memory:', skipSqliteVec: true });
    conn.exec('CREATE TABLE t (a INTEGER, b TEXT)');
    conn.run('INSERT INTO t (a, b) VALUES (?, ?)', [1, 'one']);
    conn.run('INSERT INTO t (a, b) VALUES (?, ?)', [2, 'two']);
    const all = conn.all<{ a: number; b: string }>('SELECT a, b FROM t ORDER BY a');
    expect(all).toEqual([
      { a: 1, b: 'one' },
      { a: 2, b: 'two' },
    ]);
    const one = conn.get<{ a: number }>('SELECT a FROM t WHERE b = ?', ['two']);
    expect(one?.a).toBe(2);
    conn.close();
  });

  it('readWalSize returns 0 for in-memory databases', async () => {
    const conn = await openConnection({ path: ':memory:', skipSqliteVec: true });
    expect(readWalSize(conn)).toBe(0);
    conn.close();
  });

  it('readWalSize returns a non-negative number for file-backed databases', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-wal-size-'));
    const conn = await openConnection({
      path: `${dir}/wal-size.db`,
      skipSqliteVec: true,
    });
    conn.exec('CREATE TABLE t (id INTEGER); INSERT INTO t VALUES (1);');
    const size = readWalSize(conn);
    expect(size).toBeGreaterThanOrEqual(0);
    conn.close();
  });

  it('WalCheckpointManager is idempotent for start/stop', async () => {
    const conn = await openConnection({ path: ':memory:', skipSqliteVec: true });
    const mgr = new WalCheckpointManager(conn, 1000);
    mgr.start();
    mgr.start(); // second call no-op
    mgr.stop();
    mgr.stop(); // second call no-op
    conn.close();
  });

  it('opening a non-existent path creates parent directories recursively', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-mkdirp-'));
    const conn = await openConnection({
      path: join(tmp, 'deep', 'nested', 'dirs', 'db.sqlite'),
      skipSqliteVec: true,
    });
    // Match using the OS-specific separator so the assertion is
    // portable across POSIX (`/`) and Windows (`\`).
    const sep = process.platform === 'win32' ? '\\\\' : '/';
    expect(conn.path).toMatch(new RegExp(`deep${sep}nested${sep}dirs${sep}db\\.sqlite$`));
    conn.close();
  });
});

describe('W-067: SqliteBusyError + busyTimeoutMs', () => {
  /** Stub driver whose statements throw a raw driver busy error. */
  function busyStubDriver(code: 'SQLITE_BUSY' | 'SQLITE_BUSY_SNAPSHOT') {
    const busy = () => {
      const err = new Error('database is locked') as Error & { code: string };
      err.code = code;
      throw err;
    };
    class StubDb {
      open = true;
      pragma(): unknown {
        return undefined;
      }
      exec(): void {
        busy();
      }
      prepare(): unknown {
        return {
          run: busy,
          get: busy,
          all: busy,
        };
      }
      transaction(fn: () => unknown): { immediate: () => unknown } {
        return {
          immediate: () => {
            busy();
            return fn();
          },
        };
      }
      close(): void {
        this.open = false;
      }
    }
    return StubDb as never;
  }

  it('maps raw driver SQLITE_BUSY from run/get/all/exec/transaction to SqliteBusyError with cause', async () => {
    for (const code of ['SQLITE_BUSY', 'SQLITE_BUSY_SNAPSHOT'] as const) {
      const conn = await openConnection({
        path: ':memory:',
        skipSqliteVec: true,
        driver: busyStubDriver(code),
      });
      const ops: Array<() => unknown> = [
        () => conn.run('INSERT INTO t VALUES (1)'),
        () => conn.get('SELECT 1'),
        () => conn.all('SELECT 1'),
        () => conn.exec('SELECT 1'),
        () => conn.transaction(() => 1),
      ];
      for (const op of ops) {
        let caught: unknown;
        try {
          op();
        } catch (err) {
          caught = err;
        }
        expect(caught).toBeInstanceOf(SqliteBusyError);
        const busy = caught as SqliteBusyError;
        expect(busy.code).toBe('SQLITE_BUSY');
        expect(busy.kind).toBe('sqlite-busy');
        expect(busy.message).toContain('another process holds the write lock');
        expect((busy.cause as { code?: string }).code).toBe(code);
      }
    }
  });

  it('busyTimeoutMs overrides the hardening default on file-backed DBs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-busy-'));
    const conn = await openConnection({
      path: `${dir}/busy.db`,
      skipSqliteVec: true,
      busyTimeoutMs: 1234,
    });
    expect(readPragma(conn, 'busy_timeout')).toBe(1234);
    conn.close();
  });

  it('a real contended write fails fast with SqliteBusyError under a tiny busyTimeoutMs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-contend-'));
    const path = `${dir}/contend.db`;
    const writer = await openConnection({ path, skipSqliteVec: true });
    writer.exec('CREATE TABLE t (id INTEGER)');
    const reader = await openConnection({ path, skipSqliteVec: true, busyTimeoutMs: 50 });
    // Hold the write lock from the first connection...
    writer.exec('BEGIN IMMEDIATE');
    writer.run('INSERT INTO t VALUES (1)');
    const started = Date.now();
    let caught: unknown;
    try {
      // ...and contend from the second.
      reader.run('INSERT INTO t VALUES (2)');
    } catch (err) {
      caught = err;
    } finally {
      writer.exec('COMMIT');
    }
    expect(caught).toBeInstanceOf(SqliteBusyError);
    expect(Date.now() - started).toBeLessThan(1_000);
    writer.close();
    reader.close();
  });
});

describe('W-064: incremental auto-vacuum + rowid-safe compaction', () => {
  it('a freshly created file DB gets auto_vacuum=2 (INCREMENTAL)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-av-'));
    const conn = await openConnection({ path: `${dir}/fresh.db`, skipSqliteVec: true });
    expect(readPragma(conn, 'auto_vacuum')).toBe(2);
    conn.close();
  });

  it('a pre-existing database keeps its auto_vacuum mode (the pragma is a no-op there)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-av-legacy-'));
    const path = `${dir}/legacy.db`;
    // Simulate a database created before this version: raw driver,
    // default auto_vacuum=0, at least one page written.
    const mod = (await import('better-sqlite3')) as unknown as {
      default: new (p: string) => { exec(q: string): void; close(): void };
    };
    const raw = new mod.default(path);
    raw.exec('CREATE TABLE legacy (a INTEGER)');
    raw.close();
    const conn = await openConnection({ path, skipSqliteVec: true });
    expect(readPragma(conn, 'auto_vacuum')).toBe(0);
    conn.close();
  });

  it('mass delete + incremental_vacuum shrinks the freelist while FTS integrity and search survive', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-compact-'));
    const store = await createSqliteStore({ path: `${dir}/data.db`, skipSqliteVec: true });
    await store.init();
    const conn = store.connection;
    expect(Number(conn.pragma('auto_vacuum', { simple: true }))).toBe(2);

    // Bulk-load facts + their FTS rows the way the store writes them
    // (facts_fts keyed on facts' implicit rowid).
    const padding = 'x'.repeat(2000);
    for (let i = 0; i < 300; i += 1) {
      conn.run(
        `INSERT INTO facts (id, scope_user_id, text, sensitivity, created_at)
         VALUES (?, 'u', ?, 'internal', ?)`,
        [`fact-${i}`, `token${i} ${padding}`, 1000 + i],
      );
      conn.run(
        `INSERT INTO facts_fts (rowid, text) VALUES ((SELECT rowid FROM facts WHERE id = ?), ?)`,
        [`fact-${i}`, `token${i} ${padding}`],
      );
    }
    // Hard-delete most rows, keeping FTS in sync like the store does.
    conn.run(
      "DELETE FROM facts_fts WHERE rowid IN (SELECT rowid FROM facts WHERE id != 'fact-7')",
      [],
    );
    conn.run("DELETE FROM facts WHERE id != 'fact-7'", []);

    conn.pragma('wal_checkpoint(TRUNCATE)');
    const before = Number(conn.pragma('freelist_count', { simple: true }));
    expect(before).toBeGreaterThan(0);
    let freelist = before;
    while (freelist > 0) {
      conn.pragma('incremental_vacuum(64)');
      const next = Number(conn.pragma('freelist_count', { simple: true }));
      if (next >= freelist) break;
      freelist = next;
    }
    expect(freelist).toBeLessThan(before);
    expect(freelist).toBe(0);

    // The key invariant: rowid-keyed FTS mappings survived the page moves.
    for (const report of checkFtsIntegrity(conn)) {
      expect(report).toMatchObject({ orphanRows: 0, missingRows: 0 });
    }
    const hit = conn.get<{ id: string }>(
      `SELECT f.id FROM facts_fts JOIN facts f ON f.rowid = facts_fts.rowid WHERE facts_fts MATCH 'token7'`,
      [],
    );
    expect(hit?.id).toBe('fact-7');
    await store.close();
  });
});
