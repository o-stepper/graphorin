import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  openConnection,
  readPragma,
  readWalSize,
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
