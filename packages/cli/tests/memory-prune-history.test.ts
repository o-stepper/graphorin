import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSqliteStore, type SqliteConnection } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import { runMemoryPruneHistory } from '../src/commands/memory.js';

/** Create a config pointing at a freshly-migrated, seeded SQLite db. */
async function seededConfig(seed: (conn: SqliteConnection) => void): Promise<{
  cfg: string;
  dbPath: string;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-prune-history-'));
  const dbPath = join(dir, 'data.db');
  const cfg = join(dir, 'graphorin.config.json');
  await writeFile(
    cfg,
    JSON.stringify({ storage: { path: dbPath, mode: 'lib' }, auth: { kind: 'none' } }),
    'utf8',
  );
  const store = await createSqliteStore({ path: dbPath, mode: 'lib' });
  await store.init();
  seed(store.connection);
  await store.close();
  return { cfg, dbPath };
}

function insertHistoryRow(conn: SqliteConnection, id: string, createdAt: number): void {
  conn.run(
    'INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, message_id, created_at) VALUES (?,?,?,?,?,?,?,?)',
    ['fact', id, null, 'active', 'CREATE', 'test', null, createdAt],
  );
}

async function countHistory(dbPath: string): Promise<number> {
  const store = await createSqliteStore({ path: dbPath, mode: 'lib' });
  await store.init();
  try {
    const row = store.connection.get<{ n: number }>('SELECT COUNT(*) AS n FROM memory_history');
    return row?.n ?? 0;
  } finally {
    await store.close();
  }
}

describe('graphorin memory prune-history (W-066)', () => {
  it('a DURATION prunes exactly the rows older than that age (catches age/epoch unit swaps)', async () => {
    const now = Date.now();
    const { cfg, dbPath } = await seededConfig((conn) => {
      insertHistoryRow(conn, 'old-40d', now - 40 * 86_400_000);
      insertHistoryRow(conn, 'old-31d', now - 31 * 86_400_000);
      insertHistoryRow(conn, 'fresh-1d', now - 86_400_000);
    });
    const result = await runMemoryPruneHistory({
      config: cfg,
      olderThan: '30d',
      print: () => {},
    });
    // A swapped unit (epoch cutoff instead of age) would delete 0 or 3.
    expect(result.deleted).toBe(2);
    expect(await countHistory(dbPath)).toBe(1);
  });

  it('a past ISO date converts to an AGE (now - date), pruning only older rows', async () => {
    const now = Date.now();
    const cutoffDate = new Date(now - 7 * 86_400_000);
    const { cfg, dbPath } = await seededConfig((conn) => {
      insertHistoryRow(conn, 'older-than-date', now - 10 * 86_400_000);
      insertHistoryRow(conn, 'newer-than-date', now - 2 * 86_400_000);
    });
    const result = await runMemoryPruneHistory({
      config: cfg,
      olderThan: cutoffDate.toISOString(),
      print: () => {},
    });
    expect(result.deleted).toBe(1);
    expect(await countHistory(dbPath)).toBe(1);
  });

  it('refuses a future date (would prune the entire history) and garbage input', async () => {
    const { cfg } = await seededConfig(() => {});
    await expect(
      runMemoryPruneHistory({
        config: cfg,
        olderThan: new Date(Date.now() + 86_400_000).toISOString(),
        print: () => {},
      }),
    ).rejects.toThrow(/not in the past/);
    await expect(
      runMemoryPruneHistory({ config: cfg, olderThan: 'soon', print: () => {} }),
    ).rejects.toThrow(/invalid --older-than/);
  });
});
