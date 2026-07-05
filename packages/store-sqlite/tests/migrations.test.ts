import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openConnection } from '../src/connection.js';
import {
  _resetDynamicMigrationsForTesting,
  listMigrations,
  registerMigration,
} from '../src/migrations/registry.js';
import { listAppliedMigrations, runMigrations } from '../src/migrations/runner.js';

describe('migrations', () => {
  it('lists every bundled migration in order', () => {
    const all = listMigrations();
    expect(all.length).toBeGreaterThanOrEqual(12);
    const versions = all.map((m) => m.version);
    expect(versions).toEqual([...versions].sort());
    expect(versions).toContain('001');
    expect(versions).toContain('010');
    expect(versions).toContain('011');
    expect(versions).toContain('012');
    expect(versions).toContain('013');
  });

  it('W-068 TOCTOU: a racing process that already applied a migration turns the loser into a no-op', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-mig-race-'));
    const conn = await openConnection({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
    runMigrations(conn);
    // Emulate the losing side of the race: the pre-transaction
    // applied-set read misses one version (the winner committed it in
    // between), so the runner believes it is pending. The authoritative
    // in-transaction re-check must skip it instead of replaying its
    // non-idempotent SQL ("duplicate column name").
    const staleConn: typeof conn = Object.create(conn, {
      all: {
        value: (sql: string, params?: ReadonlyArray<unknown>) => {
          const rows = conn.all<Record<string, unknown>>(sql, params);
          if (/FROM schema_migrations/.test(sql)) {
            return rows.filter((r) => r.version !== '027');
          }
          return rows;
        },
      },
    });
    const applied = runMigrations(staleConn);
    expect(applied).toEqual([]);
    // The migration is still recorded exactly once.
    const rows = conn.all<{ n: number }>(
      "SELECT COUNT(*) AS n FROM schema_migrations WHERE version = '027'",
    );
    expect(rows[0]?.n).toBe(1);
  });

  it('applies every migration on a clean DB and is idempotent on re-run', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-mig-'));
    const path = `${dir}/db.sqlite`;
    const conn = await openConnection({ path, skipSqliteVec: true });
    const applied = runMigrations(conn);
    expect(applied.length).toBe(listMigrations().length);

    const reapplied = runMigrations(conn);
    expect(reapplied.length).toBe(0);

    const stored = listAppliedMigrations(conn);
    expect(stored.length).toBe(applied.length);
    expect(stored.every((s) => s.checksum.length === 8)).toBe(true);

    // Verify a few representative tables actually exist.
    const tables = conn.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = new Set(tables.map((t) => t.name));
    expect(names.has('working_blocks')).toBe(true);
    expect(names.has('session_messages')).toBe(true);
    expect(names.has('facts')).toBe(true);
    expect(names.has('rules')).toBe(true);
    expect(names.has('episodes')).toBe(true);
    expect(names.has('embedding_meta')).toBe(true);
    expect(names.has('migration_state')).toBe(true);
    expect(names.has('workflow_checkpoints')).toBe(true);
    expect(names.has('workflow_pending_writes')).toBe(true);
    expect(names.has('sessions')).toBe(true);
    expect(names.has('agents_registry')).toBe(true);
    expect(names.has('session_handoffs')).toBe(true);
    expect(names.has('session_workflow_runs')).toBe(true);
    expect(names.has('trigger_state')).toBe(true);
    // Migration 031 dropped the dead trigger_fire_log table (W-065).
    expect(names.has('trigger_fire_log')).toBe(false);
    expect(names.has('auth_tokens')).toBe(true);
    expect(names.has('oauth_servers')).toBe(true);
    expect(names.has('idempotency_records')).toBe(true);
    expect(names.has('consolidator_state')).toBe(true);
    expect(names.has('consolidator_runs')).toBe(true);
    expect(names.has('consolidator_failed_batches')).toBe(true);
    expect(names.has('conflict_check_pending')).toBe(true);
    expect(names.has('fact_conflicts')).toBe(true);
    // Migration 030: the span end-time retention index exists.
    const spanIndexes = conn.all<{ name: string }>("PRAGMA index_list('spans')");
    expect(spanIndexes.map((i) => i.name)).toContain('idx_spans_end');
    // Migration 012 added the `conflicting_ids_json` column to
    // `conflict_check_pending` - make sure it actually landed.
    const cols = conn.all<{ name: string }>(
      "SELECT name FROM pragma_table_info('conflict_check_pending')",
    );
    const colNames = new Set(cols.map((c) => c.name));
    expect(colNames.has('conflicting_ids_json')).toBe(true);
    // Migration 013 added provenance + status to facts and episodes.
    const factCols = new Set(
      conn.all<{ name: string }>("SELECT name FROM pragma_table_info('facts')").map((c) => c.name),
    );
    expect(factCols.has('provenance')).toBe(true);
    expect(factCols.has('status')).toBe(true);
    const epCols = new Set(
      conn
        .all<{ name: string }>("SELECT name FROM pragma_table_info('episodes')")
        .map((c) => c.name),
    );
    expect(epCols.has('provenance')).toBe(true);
    expect(epCols.has('status')).toBe(true);
    // Migration 014 added the reflection `insights` table (+ FTS) (P1-1).
    expect(names.has('insights')).toBe(true);
    const insCols = new Set(
      conn
        .all<{ name: string }>("SELECT name FROM pragma_table_info('insights')")
        .map((c) => c.name),
    );
    expect(insCols.has('cites_json')).toBe(true);
    expect(insCols.has('salience')).toBe(true);
    expect(insCols.has('provenance')).toBe(true);
    expect(insCols.has('status')).toBe(true);
    conn.close();
  });

  it('rejects duplicate version registration', () => {
    _resetDynamicMigrationsForTesting();
    expect(() =>
      registerMigration({
        version: '001',
        name: 'already-taken',
        sql: '-- noop',
        owner: 'test',
      }),
    ).toThrow(/already registered/);
    _resetDynamicMigrationsForTesting();
  });

  it('accepts a dynamically-registered migration with a fresh version', async () => {
    _resetDynamicMigrationsForTesting();
    registerMigration({
      version: '901',
      name: 'extra',
      sql: 'CREATE TABLE IF NOT EXISTS extra (id TEXT PRIMARY KEY);',
      owner: 'test',
    });
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-mig2-'));
    const conn = await openConnection({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    runMigrations(conn);
    const tables = conn.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='extra'",
    );
    expect(tables.length).toBe(1);
    conn.close();
    _resetDynamicMigrationsForTesting();
  });

  it('migration_state row supports resumable per-record vector migration cursor', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-mig-state-'));
    const conn = await openConnection({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    runMigrations(conn);

    // Register two embedders so the migration_state foreign keys are
    // satisfied.
    const now = Date.now();
    conn.run(
      'INSERT INTO embedding_meta (id, embedder_kind, model, dim, distance_metric, config_hash, vec_table_facts, vec_table_episodes, vec_table_messages, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'transformersjs:Xenova/multilingual-e5-small@384',
        'transformersjs',
        'multilingual-e5-small',
        384,
        'cosine',
        'cfg-a',
        'facts_vec_a',
        'episodes_vec_a',
        'session_messages_vec_a',
        now,
      ],
    );
    conn.run(
      'INSERT INTO embedding_meta (id, embedder_kind, model, dim, distance_metric, config_hash, vec_table_facts, vec_table_episodes, vec_table_messages, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'transformersjs:Xenova/bge-m3@1024',
        'transformersjs',
        'bge-m3',
        1024,
        'cosine',
        'cfg-b',
        'facts_vec_b',
        'episodes_vec_b',
        'session_messages_vec_b',
        now,
      ],
    );

    // Round 1: start a migration (resumable cursor at record 100/1000).
    conn.run(
      'INSERT INTO migration_state (id, source_embedder, target_embedder, strategy, status, total_records, processed, last_record_id, started_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'mig-1',
        'transformersjs:Xenova/multilingual-e5-small@384',
        'transformersjs:Xenova/bge-m3@1024',
        'blue-green',
        'running',
        1000,
        100,
        'fact-100',
        now,
      ],
    );
    let row = conn.get<{ status: string; processed: number; last_record_id: string }>(
      'SELECT status, processed, last_record_id FROM migration_state WHERE id = ?',
      ['mig-1'],
    );
    expect(row?.status).toBe('running');
    expect(row?.processed).toBe(100);
    expect(row?.last_record_id).toBe('fact-100');

    // Simulate process restart: the cursor must survive a fresh
    // connection to the same file.
    conn.close();
    const conn2 = await openConnection({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    row = conn2.get<{ status: string; processed: number; last_record_id: string }>(
      'SELECT status, processed, last_record_id FROM migration_state WHERE id = ?',
      ['mig-1'],
    );
    expect(row?.status).toBe('running');
    expect(row?.processed).toBe(100);
    expect(row?.last_record_id).toBe('fact-100');

    // Round 2: advance the cursor to 500/1000.
    conn2.run('UPDATE migration_state SET processed = ?, last_record_id = ? WHERE id = ?', [
      500,
      'fact-500',
      'mig-1',
    ]);
    row = conn2.get<{ status: string; processed: number; last_record_id: string }>(
      'SELECT status, processed, last_record_id FROM migration_state WHERE id = ?',
      ['mig-1'],
    );
    expect(row?.processed).toBe(500);

    // Final commit.
    conn2.run(
      'UPDATE migration_state SET processed = ?, status = ?, finished_at = ? WHERE id = ?',
      [1000, 'committed', Date.now(), 'mig-1'],
    );
    const final = conn2.get<{ status: string; processed: number; finished_at: number | null }>(
      'SELECT status, processed, finished_at FROM migration_state WHERE id = ?',
      ['mig-1'],
    );
    expect(final?.status).toBe('committed');
    expect(final?.processed).toBe(1000);
    expect(final?.finished_at).toBeTypeOf('number');
    conn2.close();
  });

  it('runner rolls back a failing migration and rejects edits to a previously-applied migration', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-mig-fail-'));
    const conn = await openConnection({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });

    // Insert a deliberately-broken dynamic migration.
    _resetDynamicMigrationsForTesting();
    registerMigration({
      version: '950',
      name: 'broken',
      sql: 'CREATE TABLE broken_a (id TEXT); INSERT INTO non_existent_table VALUES (1);',
      owner: 'test',
    });
    expect(() => runMigrations(conn)).toThrow();
    // The broken migration must NOT be recorded as applied.
    const versionsAfterFail = listAppliedMigrations(conn).map((m) => m.version);
    expect(versionsAfterFail).not.toContain('950');
    // The earlier successful migrations should still be applied.
    expect(versionsAfterFail.length).toBeGreaterThanOrEqual(10);

    _resetDynamicMigrationsForTesting();
    conn.close();

    // The registry rejects a registration that collides with an
    // existing version, preventing duplicate or impostor entries.
    expect(() =>
      registerMigration({
        version: '001',
        name: 'memory',
        sql: '-- impostor migration',
        owner: 'evil',
      }),
    ).toThrow(/already registered/);
    _resetDynamicMigrationsForTesting();
  });

  it('runner detects after-the-fact edits to an already-applied migration', async () => {
    _resetDynamicMigrationsForTesting();
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-mig-edit-'));
    const conn = await openConnection({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    registerMigration({
      version: '910',
      name: 'aux',
      sql: 'CREATE TABLE IF NOT EXISTS aux (id TEXT PRIMARY KEY);',
      owner: 'test',
    });
    runMigrations(conn);
    expect(listAppliedMigrations(conn).some((m) => m.version === '910')).toBe(true);
    conn.close();

    _resetDynamicMigrationsForTesting();

    // Re-open and register the same version with EDITED SQL - the
    // runner must refuse on checksum mismatch.
    const conn2 = await openConnection({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    registerMigration({
      version: '910',
      name: 'aux',
      sql: 'CREATE TABLE IF NOT EXISTS aux (id TEXT PRIMARY KEY); -- edited',
      owner: 'test',
    });
    expect(() => runMigrations(conn2)).toThrow(/was modified/);
    _resetDynamicMigrationsForTesting();
    conn2.close();
  });

  it('FTS5 multilingual tokenizer indexes Russian + English + URLs + emails + diacritics', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-store-sqlite-fts-'));
    const conn = await openConnection({
      path: `${dir}/db.sqlite`,
      skipSqliteVec: true,
    });
    runMigrations(conn);

    const fixtures: ReadonlyArray<{ id: string; text: string }> = [
      { id: 'f1', text: 'Контакт: alex@example.com - встреча в горах' },
      { id: 'f2', text: 'Loves espresso and mountain hiking weekends' },
      { id: 'f3', text: 'Bookmark: https://hiking.example.com/trail/sequoia-1' },
      { id: 'f4', text: 'Préférences café espresso - éclair au chocolat' },
      { id: 'f5', text: 'Контактный email: ольга@пример.рф' },
    ];
    for (const f of fixtures) {
      conn.run(
        `INSERT INTO facts (id, scope_user_id, text, sensitivity, strength, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [f.id, 'alex', f.text, 'internal', 1.0, 0, Date.now()],
      );
      conn.run(
        `INSERT INTO facts_fts (rowid, text) VALUES ((SELECT rowid FROM facts WHERE id = ?), ?)`,
        [f.id, f.text],
      );
    }

    function search(query: string): string[] {
      return conn
        .all<{ id: string }>(
          `SELECT f.id AS id FROM facts_fts JOIN facts f ON f.rowid = facts_fts.rowid WHERE facts_fts MATCH ?`,
          [query],
        )
        .map((r) => r.id);
    }

    // Russian word match.
    expect(search('"встреча"')).toEqual(['f1']);
    // English word match.
    expect(search('"espresso"').sort()).toEqual(['f2', 'f4']);
    // Email - '@' and '.' are tokenchars so the full address is a token.
    expect(search('"alex@example.com"')).toEqual(['f1']);
    // URL - '/' and '.' tokenchars + '-' tokenchar.
    expect(search('"https://hiking.example.com/trail/sequoia-1"')).toEqual(['f3']);
    // Diacritic-folded match - `café` finds via `cafe` (diacritics removed).
    expect(search('"cafe"')).toEqual(['f4']);
    expect(search('"café"')).toEqual(['f4']);
    // Unicode email (Cyrillic local + IDN-like host).
    expect(search('"ольга@пример.рф"')).toEqual(['f5']);
    conn.close();
  });
});
