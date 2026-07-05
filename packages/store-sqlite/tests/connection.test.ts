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
