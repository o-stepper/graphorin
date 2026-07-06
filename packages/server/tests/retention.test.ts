/**
 * W-010 / W-008: the unified retention scheduler. Unit tests pin the
 * EXACT argument each store primitive receives - the primitives do not
 * share cutoff semantics (epoch-ms cutoffs vs `pruneHistory`'s AGE in
 * ms vs `idempotency.prune(now)`), and getting one wrong is a silent
 * no-op, not an error. The integration test proves a default-config
 * server actually deletes old spans + expired idempotency records on
 * its first (immediate) sweep.
 */

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security/secrets';
import { createSqliteStore, type SqliteConnection } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import { type RetentionConfig, scheduleRetentionSweeps } from '../src/runtime/retention.js';

const DAY_MS = 86_400_000;
const NOW = 1_750_000_000_000;

function makeFakeStore() {
  return {
    connection: { run: vi.fn() } as unknown as SqliteConnection,
    sessions: {
      pruneSessions: vi.fn(async () => 1),
      pruneAuditEntries: vi.fn(async () => 2),
    },
    memory: {
      pruneHistory: vi.fn(async () => 3),
      consolidator: {
        pruneRuns: vi.fn(async () => 4),
        pruneExhaustedBatches: vi.fn(async () => 5),
      },
    },
    checkpoints: { pruneThreads: vi.fn(async () => 6) },
    idempotency: { prune: vi.fn(async () => 7) },
  };
}

const BASE: RetentionConfig = {
  enabled: true,
  intervalMs: 60 * 60 * 1000,
  spansDays: 30,
  consolidatorRunsDays: 90,
  dlqExhaustedDays: 30,
  idempotency: true,
  sessionsClosedOnly: true,
};

async function flushImmediateSweep(): Promise<void> {
  // The first sweep fires synchronously from scheduleRetentionSweeps but
  // chains awaits; a couple of macrotask turns lets it finish.
  await new Promise((resolve) => setTimeout(resolve, 10));
}

describe('W-010 - scheduleRetentionSweeps unit surface table', () => {
  it('default-on surfaces get the exact documented arguments; opt-in surfaces are untouched', async () => {
    const store = makeFakeStore();
    const pruneSpansImpl = vi.fn(() => 9);
    const stop = scheduleRetentionSweeps({
      store,
      config: BASE,
      now: () => NOW,
      pruneSpansImpl,
    });
    await flushImmediateSweep();
    stop();

    // spans: epoch-ms cutoff.
    expect(pruneSpansImpl).toHaveBeenCalledWith(store.connection, {
      beforeEpochMs: NOW - 30 * DAY_MS,
    });
    // consolidator runs + DLQ: epoch-ms cutoffs.
    expect(store.memory.consolidator.pruneRuns).toHaveBeenCalledWith(NOW - 90 * DAY_MS);
    expect(store.memory.consolidator.pruneExhaustedBatches).toHaveBeenCalledWith(NOW - 30 * DAY_MS);
    // idempotency: the CURRENT moment (compared against expires_at).
    expect(store.idempotency.prune).toHaveBeenCalledWith(NOW);
    // Primary content stays untouched without an explicit window.
    expect(store.sessions.pruneSessions).not.toHaveBeenCalled();
    expect(store.sessions.pruneAuditEntries).not.toHaveBeenCalled();
    expect(store.memory.pruneHistory).not.toHaveBeenCalled();
    expect(store.checkpoints.pruneThreads).not.toHaveBeenCalled();
  });

  it('opt-in windows activate their surfaces with the correct units', async () => {
    const store = makeFakeStore();
    const stop = scheduleRetentionSweeps({
      store,
      config: {
        ...BASE,
        sessionsDays: 7,
        auditDays: 14,
        memoryHistoryDays: 21,
        workflowThreadsDays: 28,
      },
      now: () => NOW,
      pruneSpansImpl: () => 0,
    });
    await flushImmediateSweep();
    stop();

    expect(store.sessions.pruneSessions).toHaveBeenCalledWith({
      beforeEpochMs: NOW - 7 * DAY_MS,
      closedOnly: true,
    });
    expect(store.sessions.pruneAuditEntries).toHaveBeenCalledWith(NOW - 14 * DAY_MS);
    // pruneHistory takes an AGE in ms - NOT an epoch cutoff. An epoch
    // cutoff would resolve to `Date.now() - epoch` around 1970 inside
    // the store and silently delete nothing.
    expect(store.memory.pruneHistory).toHaveBeenCalledWith(21 * DAY_MS);
    expect(store.checkpoints.pruneThreads).toHaveBeenCalledWith({
      beforeEpochMs: NOW - 28 * DAY_MS,
      onlyTerminal: true,
    });
  });

  it('sessionsClosedOnly=false is forwarded', async () => {
    const store = makeFakeStore();
    const stop = scheduleRetentionSweeps({
      store,
      config: { ...BASE, sessionsDays: 7, sessionsClosedOnly: false },
      now: () => NOW,
      pruneSpansImpl: () => 0,
    });
    await flushImmediateSweep();
    stop();
    expect(store.sessions.pruneSessions).toHaveBeenCalledWith({
      beforeEpochMs: NOW - 7 * DAY_MS,
      closedOnly: false,
    });
  });

  it('idempotency=false skips the idempotency surface', async () => {
    const store = makeFakeStore();
    const stop = scheduleRetentionSweeps({
      store,
      config: { ...BASE, idempotency: false },
      now: () => NOW,
      pruneSpansImpl: () => 0,
    });
    await flushImmediateSweep();
    stop();
    expect(store.idempotency.prune).not.toHaveBeenCalled();
  });

  it('enabled=false creates no timer and never touches the store', async () => {
    vi.useFakeTimers();
    try {
      const store = makeFakeStore();
      const pruneSpansImpl = vi.fn(() => 0);
      const stop = scheduleRetentionSweeps({
        store,
        config: { ...BASE, enabled: false },
        now: () => NOW,
        pruneSpansImpl,
      });
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(BASE.intervalMs * 3);
      expect(pruneSpansImpl).not.toHaveBeenCalled();
      expect(store.idempotency.prune).not.toHaveBeenCalled();
      stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('the interval re-sweeps and stop() halts further sweeps', async () => {
    vi.useFakeTimers();
    try {
      const store = makeFakeStore();
      const pruneSpansImpl = vi.fn(() => 0);
      const stop = scheduleRetentionSweeps({
        store,
        config: { ...BASE, intervalMs: 1_000 },
        now: () => NOW,
        pruneSpansImpl,
      });
      await vi.advanceTimersByTimeAsync(0); // immediate sweep
      expect(pruneSpansImpl).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1_000);
      expect(pruneSpansImpl).toHaveBeenCalledTimes(2);
      stop();
      await vi.advanceTimersByTimeAsync(5_000);
      expect(pruneSpansImpl).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('one failing surface logs WARN and never blocks the others', async () => {
    const store = makeFakeStore();
    const log = vi.fn();
    const stop = scheduleRetentionSweeps({
      store,
      config: BASE,
      now: () => NOW,
      log,
      pruneSpansImpl: () => {
        throw new Error('spans table locked');
      },
    });
    await flushImmediateSweep();
    stop();
    expect(store.memory.consolidator.pruneRuns).toHaveBeenCalled();
    expect(store.idempotency.prune).toHaveBeenCalledWith(NOW);
    expect(log).toHaveBeenCalledWith(
      'warn',
      expect.stringContaining('spans'),
      expect.objectContaining({ surface: 'spans', error: 'spans table locked' }),
    );
    // The sweep still reports its per-surface counts.
    expect(log).toHaveBeenCalledWith(
      'info',
      expect.stringContaining('complete'),
      expect.objectContaining({ idempotency: 7 }),
    );
  });

  it('a store.memory without a consolidator surface skips it without failing the sweep', async () => {
    const store = makeFakeStore();
    const bareMemory = { pruneHistory: vi.fn(async () => 0) };
    const log = vi.fn();
    const stop = scheduleRetentionSweeps({
      store: { ...store, memory: bareMemory },
      config: BASE,
      now: () => NOW,
      log,
      pruneSpansImpl: () => 0,
    });
    await flushImmediateSweep();
    stop();
    expect(store.idempotency.prune).toHaveBeenCalledWith(NOW);
    expect(log).not.toHaveBeenCalledWith('warn', expect.anything(), expect.anything());
  });
});

describe('W-010 / W-008 - integration: default config prunes on the first sweep', () => {
  let active: GraphorinServer | undefined;

  afterEach(async () => {
    if (active !== undefined) {
      await active.stop();
      active = undefined;
    }
  });

  it('a freshly started server deletes 31-day-old spans and expired idempotency records', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    const store = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    await store.init();

    const now = Date.now();
    const insertSpan = (id: string, endEpochMs: number): void => {
      store.connection.run(
        `INSERT INTO spans (span_id, trace_id, type, name, start_unix_nano, end_unix_nano,
           status, attributes_json, events_json)
         VALUES (?, ?, 'agent.run', 'r', ?, ?, 'ok', '{}', '[]')`,
        [id, `t-${id}`, (endEpochMs - 5) * 1e6, endEpochMs * 1e6],
      );
    };
    insertSpan('old-span', now - 31 * DAY_MS);
    insertSpan('fresh-span', now - 1 * DAY_MS);
    store.connection.run(
      `INSERT INTO idempotency_records (key, request_hash, status_code, response_json, created_at, expires_at)
       VALUES ('expired', 'h', 200, '{}', ?, ?)`,
      [now - 2 * DAY_MS, now - DAY_MS],
    );
    store.connection.run(
      `INSERT INTO idempotency_records (key, request_hash, status_code, response_json, created_at, expires_at)
       VALUES ('live', 'h', 200, '{}', ?, ?)`,
      [now, now + DAY_MS],
    );

    active = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        observability: { logger: 'silent' },
      },
    });
    await active.start();
    // The first sweep is immediate but asynchronous.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const spanIds = store.connection
      .all<{ span_id: string }>('SELECT span_id FROM spans ORDER BY span_id', [])
      .map((r) => r.span_id);
    expect(spanIds).toEqual(['fresh-span']);
    const keys = store.connection
      .all<{ key: string }>('SELECT key FROM idempotency_records ORDER BY key', [])
      .map((r) => r.key);
    expect(keys).toEqual(['live']);
  });

  it('retention.enabled=false leaves stale rows alone', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    const store = await createSqliteStore({
      path: ':memory:',
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    await store.init();
    const now = Date.now();
    store.connection.run(
      `INSERT INTO spans (span_id, trace_id, type, name, start_unix_nano, end_unix_nano,
         status, attributes_json, events_json)
       VALUES ('ancient', 't', 'agent.run', 'r', 0, ?, 'ok', '{}', '[]')`,
      [(now - 365 * DAY_MS) * 1e6],
    );

    active = await createServer({
      store,
      skipHardening: true,
      skipListen: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        retention: { enabled: false },
        observability: { logger: 'silent' },
      },
    });
    await active.start();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const count = store.connection.all<{ n: number }>('SELECT COUNT(*) AS n FROM spans', [])[0];
    expect(count?.n).toBe(1);
  });
});
