import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSqliteStore, type SqliteConnection } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import { runMemoryWhy } from '../src/commands/memory.js';

async function seededConfig(seed: (conn: SqliteConnection) => void): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-why-'));
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
  return cfg;
}

function insertRecallSpan(
  conn: SqliteConnection,
  spanId: string,
  sessionId: string,
  start: number,
  explain: ReadonlyArray<unknown>,
): void {
  conn.run(
    `INSERT INTO spans (span_id, trace_id, type, name, start_unix_nano, end_unix_nano, status, attributes_json, events_json, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      spanId,
      'tr-1',
      'memory.search.semantic',
      'memory.search.semantic',
      start,
      start + 1,
      'ok',
      JSON.stringify({
        'graphorin.session.id': sessionId,
        'memory.search.semantic.explain': JSON.stringify(explain),
      }),
      '[]',
      sessionId,
    ],
  );
}

describe('graphorin memory why (RP-17)', () => {
  it('decodes the recall explanation off the persisted spans', async () => {
    const explain = [
      { id: 'fact-1', rank: 1, score: 0.9, signals: { bm25: 0.5, vector: 0.4, rrf: 0.03 } },
      { id: 'fact-2', rank: 2, score: 0.6, signals: { bm25: 0.3, vector: 0.3 } },
    ];
    const cfg = await seededConfig((conn) => {
      insertRecallSpan(conn, 'sp-1', 'sess-1', 1000, explain);
    });
    const lines: string[] = [];
    const result = await runMemoryWhy({ config: cfg, print: (l) => lines.push(l) });

    expect(result.recalls).toHaveLength(1);
    expect(result.recalls[0]?.results.map((r) => r.id)).toEqual(['fact-1', 'fact-2']);
    expect(result.recalls[0]?.results[0]?.signals.bm25).toBe(0.5);
    const out = lines.join('\n');
    expect(out).toContain('fact-1');
    expect(out).toContain('bm25=0.500'); // signals are rendered
  });

  it('restricts to a session and caps with --limit', async () => {
    const mk = (id: string): ReadonlyArray<unknown> => [
      { id, rank: 1, score: 0.5, signals: { bm25: 0.5 } },
    ];
    const cfg = await seededConfig((conn) => {
      insertRecallSpan(conn, 'sp-a', 'sess-A', 100, mk('a'));
      insertRecallSpan(conn, 'sp-b', 'sess-A', 200, mk('b'));
      insertRecallSpan(conn, 'sp-c', 'sess-B', 300, mk('c'));
    });
    // Newest-first, capped at 1, filtered to sess-A → only sp-b.
    const result = await runMemoryWhy({
      config: cfg,
      sessionId: 'sess-A',
      limit: 1,
      print: () => {},
    });
    expect(result.recalls).toHaveLength(1);
    expect(result.recalls[0]?.spanId).toBe('sp-b');
  });
});
