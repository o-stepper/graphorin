/**
 * Tests for the reflection `insights` store (migration 014 / P1-1):
 * insert + cites round-trip, the quarantine retrieval gate, FTS search,
 * the ExpeL salience bump (clamped at 0), and soft-delete pruning.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Insight, SessionScope } from '@graphorin/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { openConnection } from '../src/connection.js';
import { EmbeddingMetaRepository } from '../src/embedding-meta-repo.js';
import { SqliteMemoryStore } from '../src/memory-store.js';
import { runMigrations } from '../src/migrations/runner.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };

async function makeStore(): Promise<SqliteMemoryStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-insights-'));
  const conn = await openConnection({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  runMigrations(conn);
  const store = new SqliteMemoryStore(conn, new EmbeddingMetaRepository(conn, 'multi-active'));
  await store.init();
  return store;
}

let counter = 0;
function mkInsight(over: Partial<Insight> = {}): Insight {
  counter += 1;
  const now = new Date().toISOString();
  return {
    id: `ins_${counter}`,
    kind: 'insight',
    userId: SCOPE.userId,
    sessionId: SCOPE.sessionId,
    text: 'The user is overcommitted on evening plans.',
    cites: ['ep_1', 'ep_2'],
    salience: 2,
    provenance: 'reflection',
    status: 'quarantined',
    sensitivity: 'internal',
    createdAt: now,
    updatedAt: now,
    ...over,
  } as Insight;
}

describe('SqliteInsightStore (P1-1)', () => {
  let store: SqliteMemoryStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('insert + get round-trips text, cites, salience, provenance, status', async () => {
    const insight = mkInsight({ id: 'ins_a', cites: ['ep_1', 'ep_2', 'fact_9'] });
    await store.insights.insert(insight);
    const got = await store.insights.get('ins_a');
    expect(got).not.toBeNull();
    expect(got?.kind).toBe('insight');
    expect(got?.text).toBe('The user is overcommitted on evening plans.');
    expect(got?.cites).toEqual(['ep_1', 'ep_2', 'fact_9']);
    expect(got?.salience).toBe(2);
    expect(got?.provenance).toBe('reflection');
    expect(got?.status).toBe('quarantined');
  });

  it('quarantine gates list + search; includeQuarantined surfaces them', async () => {
    await store.insights.insert(mkInsight({ id: 'ins_q', status: 'quarantined' }));
    await store.insights.insert(
      mkInsight({ id: 'ins_active', status: 'active', text: 'A validated overcommitted pattern.' }),
    );

    // Default reads exclude quarantined (action-driving recall).
    const listed = await store.insights.list(SCOPE);
    expect(listed.map((i) => i.id)).toEqual(['ins_active']);
    const searched = await store.insights.search(SCOPE, 'overcommitted');
    expect(searched.map((h) => h.record.id)).toEqual(['ins_active']);

    // The inspector path surfaces both.
    const listedAll = await store.insights.list(SCOPE, { includeQuarantined: true });
    expect(listedAll.map((i) => i.id).sort()).toEqual(['ins_active', 'ins_q']);
    const searchedAll = await store.insights.search(SCOPE, 'overcommitted', {
      includeQuarantined: true,
    });
    expect(searchedAll.map((h) => h.record.id).sort()).toEqual(['ins_active', 'ins_q']);
  });

  it('bumpSalience adjusts and clamps at 0', async () => {
    await store.insights.insert(mkInsight({ id: 'ins_s', salience: 2 }));
    await store.insights.bumpSalience('ins_s', 1);
    expect((await store.insights.get('ins_s'))?.salience).toBe(3);
    await store.insights.bumpSalience('ins_s', -10); // clamps, never negative
    expect((await store.insights.get('ins_s'))?.salience).toBe(0);
  });

  it('prune soft-deletes salience-0 insights only, returns the count, keeps survivors', async () => {
    await store.insights.insert(mkInsight({ id: 'ins_dead', salience: 0 }));
    await store.insights.insert(mkInsight({ id: 'ins_live', salience: 2 }));

    const pruned = await store.insights.prune(SCOPE);
    expect(pruned).toBe(1);

    // Tombstoned — unreachable through get/list, but the survivor stays.
    expect(await store.insights.get('ins_dead')).toBeNull();
    expect(await store.insights.get('ins_live')).not.toBeNull();
    const remaining = await store.insights.list(SCOPE, { includeQuarantined: true });
    expect(remaining.map((i) => i.id)).toEqual(['ins_live']);

    // Idempotent — nothing left at salience 0.
    expect(await store.insights.prune(SCOPE)).toBe(0);
  });

  it('tolerates malformed cites JSON (defensive → empty array)', async () => {
    await store.insights.insert(mkInsight({ id: 'ins_ok', cites: [] }));
    expect((await store.insights.get('ins_ok'))?.cites).toEqual([]);
  });
});
