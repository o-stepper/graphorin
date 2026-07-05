import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  checkFtsIntegrity,
  createSqliteStore,
  formatFtsIntegrityWarning,
  listCheckedFtsTables,
} from '../src/index.js';

/**
 * CS-10 - the FTS5 indexes key on the base table's implicit rowid, which a
 * hand-run VACUUM could renumber and silently corrupt. We never VACUUM, so the
 * guard is a cheap open-time orphan-row check + loud warning.
 */
async function freshPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cs10-'));
  return `${dir}/db.sqlite`;
}

describe('CS-10 - FTS↔rowid integrity guard', () => {
  it('reports no orphans for a consistent store and formats to null', async () => {
    const store = await createSqliteStore({ path: await freshPath(), skipSqliteVec: true });
    await store.init();
    await store.memory.semantic.remember({
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      id: 'f1',
      text: 'consistent fact',
      createdAt: new Date().toISOString(),
    });
    const reports = checkFtsIntegrity(store.connection);
    expect(reports).toEqual([]);
    expect(formatFtsIntegrityWarning(reports)).toBeNull();
    await store.close();
  });

  it('detects an orphaned FTS row and formats a VACUUM-aware warning', async () => {
    const store = await createSqliteStore({ path: await freshPath(), skipSqliteVec: true });
    await store.init();
    // Simulate rowid drift: an FTS row whose rowid matches no base row.
    store.connection.run('INSERT INTO facts_fts (rowid, text) VALUES (?, ?)', [987654, 'ghost']);
    const reports = checkFtsIntegrity(store.connection);
    expect(reports).toEqual([{ table: 'facts_fts', orphanRows: 1 }]);
    const warning = formatFtsIntegrityWarning(reports);
    expect(warning).toMatch(/VACUUM/);
    await store.close();
  });

  it('warns at open time when the store is already drifted', async () => {
    const path = await freshPath();
    const store1 = await createSqliteStore({ path, skipSqliteVec: true });
    await store1.init();
    store1.connection.run('INSERT INTO facts_fts (rowid, text) VALUES (?, ?)', [424242, 'ghost']);
    await store1.close();

    const warnings: string[] = [];
    const store2 = await createSqliteStore({
      path,
      skipSqliteVec: true,
      warn: (m) => warnings.push(m),
    });
    await store2.init();
    expect(warnings.some((w) => /VACUUM/.test(w))).toBe(true);
    await store2.close();
  });

  it('respects skipFtsIntegrityCheck', async () => {
    const path = await freshPath();
    const store1 = await createSqliteStore({ path, skipSqliteVec: true });
    await store1.init();
    store1.connection.run('INSERT INTO facts_fts (rowid, text) VALUES (?, ?)', [111, 'ghost']);
    await store1.close();

    const warnings: string[] = [];
    const store2 = await createSqliteStore({
      path,
      skipSqliteVec: true,
      skipFtsIntegrityCheck: true,
      warn: (m) => warnings.push(m),
    });
    await store2.init();
    expect(warnings).toEqual([]);
    await store2.close();
  });
});

describe('W-113: rules_fts coverage + FTS_PAIRS completeness self-check', () => {
  it('detects orphaned rules_fts rows', async () => {
    const path = await freshPath();
    const store = await createSqliteStore({ path, skipSqliteVec: true });
    await store.init();
    store.connection.run('INSERT INTO rules_fts (rowid, text) VALUES (?, ?)', [
      222,
      'ghost rule with no base row',
    ]);
    const reports = checkFtsIntegrity(store.connection);
    const rules = reports.find((r) => r.table === 'rules_fts');
    expect(rules?.orphanRows).toBe(1);
    await store.close();
  });

  it('every %_fts table of a fully-migrated database is registered in FTS_PAIRS', async () => {
    const path = await freshPath();
    const store = await createSqliteStore({ path, skipSqliteVec: true });
    await store.init();
    // FTS5 creates shadow tables (`<name>_data`, `_idx`, `_content`,
    // `_docsize`, `_config`) - only the virtual tables themselves count.
    const virtualFts = store.connection
      .all<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '%\\_fts' ESCAPE '\\' AND sql LIKE '%fts5%'",
      )
      .map((r) => r.name)
      .sort();
    const covered = [...listCheckedFtsTables()].sort();
    // A NEW *_fts table that is not in FTS_PAIRS fails here instead of
    // silently escaping the CS-10 guard (how rules_fts was missed).
    expect(virtualFts).toEqual(covered);
    await store.close();
  });
});
