import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSqliteStore, type SqliteConnection } from '@graphorin/store-sqlite';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type MemoryActivityResult,
  type MemoryInspectOptions,
  type MemoryInspectResult,
  runMemoryActivity,
  runMemoryInspect,
} from '../src/commands/memory.js';

const T0 = 1_700_000_000_000;
const T1 = 1_700_100_000_000;
const T2 = 1_700_200_000_000;

/** Create a config pointing at a freshly-migrated, seeded SQLite db. */
async function seededConfig(seed: (conn: SqliteConnection) => void): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-mem-'));
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

/**
 * Seed a small graph: fact fA (superseded by fB), fB (live, extraction),
 * a quarantined fact fQ, an insight citing fB, a conflict that recorded
 * the supersede, and three audit-log rows.
 */
function seedGraph(conn: SqliteConnection): void {
  const insertFact = (row: {
    id: string;
    text: string;
    status: string;
    provenance: string | null;
    validFrom: number | null;
    validTo: number | null;
    supersedes: string | null;
    supersededBy: string | null;
    createdAt: number;
  }): void => {
    conn.run(
      'INSERT INTO facts (id, scope_user_id, text, sensitivity, status, provenance, valid_from, valid_to, supersedes, superseded_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [
        row.id,
        'u1',
        row.text,
        'internal',
        row.status,
        row.provenance,
        row.validFrom,
        row.validTo,
        row.supersedes,
        row.supersededBy,
        row.createdAt,
      ],
    );
  };
  insertFact({
    id: 'fA',
    text: 'likes Python',
    status: 'active',
    provenance: 'user',
    validFrom: T0,
    validTo: T1,
    supersedes: null,
    supersededBy: 'fB',
    createdAt: T0,
  });
  insertFact({
    id: 'fB',
    text: 'likes Rust',
    status: 'active',
    provenance: 'extraction',
    validFrom: T1,
    validTo: null,
    supersedes: 'fA',
    supersededBy: null,
    createdAt: T1,
  });
  insertFact({
    id: 'fQ',
    text: 'maybe likes Go',
    status: 'quarantined',
    provenance: 'extraction',
    validFrom: T1,
    validTo: null,
    supersedes: null,
    supersededBy: null,
    createdAt: T1,
  });
  conn.run(
    'INSERT INTO insights (id, scope_user_id, text, cites_json, salience, status, created_at) VALUES (?,?,?,?,?,?,?)',
    ['iA', 'u1', 'prefers systems languages', '["fB"]', 2, 'quarantined', T1],
  );
  conn.run(
    'INSERT INTO fact_conflicts (scope_user_id, candidate_id, existing_id, decision, stage, similarity, detected_at) VALUES (?,?,?,?,?,?,?)',
    ['u1', 'fB', 'fA', 'supersede', 'subject-predicate', 0.88, T1],
  );
  const insertHistory = (memoryId: string, event: string, source: string, at: number): void => {
    conn.run(
      'INSERT INTO memory_history (memory_kind, memory_id, event, source, created_at) VALUES (?,?,?,?,?)',
      ['fact', memoryId, event, source, at],
    );
  };
  insertHistory('fA', 'SUPERSEDE', 'consolidator', T1);
  insertHistory('fQ', 'QUARANTINE', 'consolidator', T1);
  insertHistory('fB', 'VALIDATE', 'agent', T2);
}

describe('graphorin memory inspect', () => {
  it('surfaces the supersede chain, conflicts, audit, and citing insights for a fact', async () => {
    const cfg = await seededConfig(seedGraph);
    const out = await runMemoryInspect({ config: cfg, factId: 'fB', print: () => undefined });

    expect(out.found).toBe(true);
    expect(out.fact?.id).toBe('fB');
    expect(out.fact?.status).toBe('active');
    expect(out.fact?.provenance).toBe('extraction');
    expect(out.fact?.validTo).toBeNull();

    // chain ordered oldest -> newest by validity interval.
    expect(out.chain.map((c) => c.id)).toEqual(['fA', 'fB']);
    expect(out.chain[0]?.supersededBy).toBe('fB');
    expect(out.chain[1]?.supersedes).toBe('fA');

    expect(out.history.map((h) => h.event)).toEqual(['VALIDATE']);
    expect(out.conflicts).toHaveLength(1);
    expect(out.conflicts[0]?.decision).toBe('supersede');
    expect(out.conflicts[0]?.existingId).toBe('fA');
    expect(out.conflicts[0]?.similarity).toBeCloseTo(0.88, 5);

    expect(out.citingInsights).toHaveLength(1);
    expect(out.citingInsights[0]?.id).toBe('iA');
    expect(out.citingInsights[0]?.status).toBe('quarantined');
  });

  it('reports not-found for an unknown fact id', async () => {
    const cfg = await seededConfig(seedGraph);
    const out = await runMemoryInspect({ config: cfg, factId: 'nope', print: () => undefined });
    expect(out.found).toBe(false);
    expect(out.fact).toBeNull();
    expect(out.chain).toHaveLength(0);
  });

  it('emits a JSON document under --json', async () => {
    const cfg = await seededConfig(seedGraph);
    let payload: unknown;
    await runMemoryInspect({
      config: cfg,
      factId: 'fB',
      json: true,
      jsonPrint: (p) => {
        payload = p;
      },
    });
    expect((payload as MemoryInspectResult).fact?.id).toBe('fB');
  });

  it('inspects a standalone quarantined fact (no chain, no conflicts, no citers)', async () => {
    const cfg = await seededConfig(seedGraph);
    const out = await runMemoryInspect({ config: cfg, factId: 'fQ', print: () => undefined });
    expect(out.found).toBe(true);
    expect(out.fact?.status).toBe('quarantined');
    expect(out.chain).toHaveLength(1);
    expect(out.conflicts).toHaveLength(0);
    expect(out.citingInsights).toHaveLength(0);
    expect(out.history.map((h) => h.event)).toEqual(['QUARANTINE']);
  });
});

describe('graphorin memory activity', () => {
  it('reports quarantine counts and recent history + conflicts', async () => {
    const cfg = await seededConfig(seedGraph);
    const out = await runMemoryActivity({ config: cfg, print: () => undefined });

    expect(out.quarantine.facts).toBe(1);
    expect(out.quarantine.episodes).toBe(0);
    expect(out.quarantine.insights).toBe(1);

    expect(out.recentHistory).toHaveLength(3);
    expect(out.recentConflicts).toHaveLength(1);
    expect(out.recentConflicts[0]?.decision).toBe('supersede');
  });

  it('honours the --limit cap', async () => {
    const cfg = await seededConfig(seedGraph);
    const out = await runMemoryActivity({ config: cfg, limit: 1, print: () => undefined });
    expect(out.recentHistory).toHaveLength(1);
  });

  it('returns zeroed activity on a fresh DB', async () => {
    const cfg = await seededConfig(() => undefined);
    const out = await runMemoryActivity({ config: cfg, print: () => undefined });
    expect(out.quarantine.facts).toBe(0);
    expect(out.recentHistory).toHaveLength(0);
    expect(out.recentConflicts).toHaveLength(0);
  });
});

describe('types', () => {
  it('exposes the documented public shapes', () => {
    expectTypeOf(runMemoryInspect).returns.resolves.toEqualTypeOf<MemoryInspectResult>();
    expectTypeOf(runMemoryActivity).returns.resolves.toEqualTypeOf<MemoryActivityResult>();
    expectTypeOf<MemoryInspectOptions['factId']>().toBeString();
    expectTypeOf<MemoryActivityResult['quarantine']>().toMatchTypeOf<{ readonly facts: number }>();
  });
});
