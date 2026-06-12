import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createSqliteStore } from '../src/index.js';

/**
 * CS-14 — `facts.hash` + `idx_facts_hash` were dead schema: the only write path
 * bound NULL unconditionally and nothing ever read the column (stage-1 dedup
 * recomputes its digest in-process). Migration 023 drops both; the write/read
 * path must keep working without them.
 */
describe('CS-14 — dead facts.hash column + index are removed', () => {
  it('drops the hash column and idx_facts_hash, and remember/search still work', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cs14-'));
    const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
    await store.init();

    const columns = store.connection
      .all<{ name: string }>('PRAGMA table_info(facts)')
      .map((c) => c.name);
    expect(columns).not.toContain('hash');

    const idx = store.connection.get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_facts_hash'",
    );
    expect(idx).toBeUndefined();

    // The hot write + FTS read path is unaffected by the column removal.
    await store.memory.semantic.remember({
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      id: 'f1',
      text: 'espresso machine maintenance',
      createdAt: new Date().toISOString(),
    });
    const hits = await store.memory.semantic.search(
      { userId: 'alex' },
      { query: 'espresso' },
    );
    expect(hits.map((h) => h.record.id)).toContain('f1');

    await store.close();
  });
});
