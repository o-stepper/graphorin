/**
 * W-006/W-008: span retention primitives - deleteSpansForSession,
 * pruneSpans (end-time based, index-backed), and the session cascade.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createSqliteStore,
  deleteSpansForSession,
  type GraphorinSqliteStore,
  pruneSpans,
} from '../src/index.js';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-span-retention-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

function insertSpan(
  store: GraphorinSqliteStore,
  spanId: string,
  args: { readonly sessionId?: string | null; readonly endEpochMs: number },
): void {
  store.connection.run(
    `INSERT INTO spans (span_id, trace_id, parent_id, type, name, start_unix_nano, end_unix_nano, status, attributes_json, events_json, session_id)
     VALUES (?, 'tr', NULL, 'agent.run', 'agent.run', ?, ?, 'ok', '{}', '[]', ?)`,
    [spanId, (args.endEpochMs - 10) * 1e6, args.endEpochMs * 1e6, args.sessionId ?? null],
  );
}

function spanCount(store: GraphorinSqliteStore, where = '1=1', params: unknown[] = []): number {
  return store.connection.get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM spans WHERE ${where}`,
    params,
  )?.n as number;
}

describe('deleteSpansForSession (W-006)', () => {
  it('deletes exactly the session rows, keeping other sessions and NULL-session rows', async () => {
    const store = await makeStore();
    insertSpan(store, 'a1', { sessionId: 's-a', endEpochMs: Date.now() });
    insertSpan(store, 'a2', { sessionId: 's-a', endEpochMs: Date.now() });
    insertSpan(store, 'b1', { sessionId: 's-b', endEpochMs: Date.now() });
    insertSpan(store, 'n1', { sessionId: null, endEpochMs: Date.now() });
    const removed = deleteSpansForSession(store.connection, 's-a');
    expect(removed).toBe(2);
    expect(spanCount(store, "session_id = 's-a'")).toBe(0);
    expect(spanCount(store, "session_id = 's-b'")).toBe(1);
    expect(spanCount(store, 'session_id IS NULL')).toBe(1);
  });
});

describe('pruneSpans (W-008)', () => {
  it('deletes spans that FINISHED before the cutoff, inclusive-exclusive boundary pinned', async () => {
    const store = await makeStore();
    const cutoff = Date.now();
    insertSpan(store, 'old', { sessionId: 's', endEpochMs: cutoff - 1 });
    insertSpan(store, 'at-cutoff', { sessionId: 's', endEpochMs: cutoff });
    insertSpan(store, 'fresh', { sessionId: 's', endEpochMs: cutoff + 1 });
    const removed = pruneSpans(store.connection, { beforeEpochMs: cutoff });
    expect(removed).toBe(1);
    // Strict `<`: the span ending exactly at the cutoff survives.
    expect(spanCount(store, "span_id = 'at-cutoff'")).toBe(1);
    expect(spanCount(store, "span_id = 'fresh'")).toBe(1);
    expect(spanCount(store, "span_id = 'old'")).toBe(0);
  });

  it('covers rows with session_id IS NULL (age is their only deletion path)', async () => {
    const store = await makeStore();
    insertSpan(store, 'orphan-old', { sessionId: null, endEpochMs: Date.now() - 100_000 });
    insertSpan(store, 'orphan-new', { sessionId: null, endEpochMs: Date.now() + 100_000 });
    const removed = pruneSpans(store.connection, { beforeEpochMs: Date.now() });
    expect(removed).toBe(1);
    expect(spanCount(store, 'session_id IS NULL')).toBe(1);
  });

  it('the DELETE is index-backed (idx_spans_end), not a full scan', async () => {
    const store = await makeStore();
    const plan = store.connection.all<{ detail: string }>(
      'EXPLAIN QUERY PLAN DELETE FROM spans WHERE end_unix_nano < ?',
      [1],
    );
    expect(JSON.stringify(plan)).toContain('idx_spans_end');
  });
});

describe('session cascade covers spans (W-006)', () => {
  it('deleteSession removes the session spans; pruneSessions inherits it', async () => {
    const store = await makeStore();
    await store.sessions.createSession({
      id: 's-span',
      userId: 'alex',
      agentId: 'a-1',
      createdAt: new Date().toISOString(),
    });
    insertSpan(store, 'sp-live', { sessionId: 's-span', endEpochMs: Date.now() });
    insertSpan(store, 'sp-other', { sessionId: 's-other', endEpochMs: Date.now() });
    await store.sessions.deleteSession('s-span');
    expect(spanCount(store, "session_id = 's-span'")).toBe(0);
    expect(spanCount(store, "session_id = 's-other'")).toBe(1);
  });
});
