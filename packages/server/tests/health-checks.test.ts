import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  type ConsolidatorCheck,
  collectHealth,
  rollup,
  type StorageCheck,
} from '../src/health/checks.js';

let store: GraphorinSqliteStore;

beforeEach(async () => {
  store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  await store.init();
});

afterEach(async () => {
  await store.close().catch(() => {});
});

describe('health/checks', () => {
  it('rollup() promotes the worst per-check status', () => {
    // rollup() only reads `.status` - the slim literals stand in for full checks.
    expect(rollup({})).toBe('ok');
    expect(rollup({ storage: { status: 'ok' } as StorageCheck })).toBe('ok');
    expect(rollup({ storage: { status: 'warn' } as StorageCheck })).toBe('degraded');
    expect(
      rollup({
        storage: { status: 'warn' } as StorageCheck,
        consolidator: { status: 'fail' } as ConsolidatorCheck,
      }),
    ).toBe('failing');
  });

  it('collectHealth surfaces storage + replay buffer probes (flat shape)', async () => {
    const summary = await collectHealth({
      store,
      replayBuffer: { eventsBuffered: 12, subscribers: 3, subscriptions: 5 },
    });
    expect(summary.status).toBe('ok');
    expect(summary.checks.storage?.status).toBe('ok');
    expect(summary.checks.storage?.walSizeBytes).toBeGreaterThanOrEqual(0);
    expect(summary.checks.storage?.warnThresholdBytes).toBeGreaterThan(0);
    expect(summary.checks.replayBuffer).toMatchObject({
      status: 'ok',
      eventsBuffered: 12,
      subscribers: 3,
      subscriptions: 5,
    });
  });

  it('clamps walSizeBytes to 0 when the database is not in WAL mode (S-09)', async () => {
    // A file-backed store with WAL hardening disabled stays in the
    // default journal mode; `wal_checkpoint(PASSIVE)` then reports
    // log=-1, which used to surface as walSizeBytes: -4096.
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-health-wal-'));
    const fileStore = await createSqliteStore({
      path: join(dir, 'data.db'),
      mode: 'lib',
      skipSqliteVec: true,
      disableWalHardening: true,
    });
    await fileStore.init();
    try {
      const summary = await collectHealth({ store: fileStore });
      expect(summary.checks.storage?.status).toBe('ok');
      expect(summary.checks.storage?.walSizeBytes).toBe(0);
    } finally {
      await fileStore.close().catch(() => {});
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('flags encryption fail when encryption enabled but cipher peer missing', async () => {
    const summary = await collectHealth({
      encryptionEnabled: true,
      cipherPeerInstalled: false,
    });
    expect(summary.status).toBe('failing');
    expect(summary.checks.encryption?.status).toBe('fail');
  });

  it('flags consolidator warn when paused or DLQ non-empty (flat shape)', async () => {
    const summary = await collectHealth({
      consolidator: {
        async start() {},
        async stop() {},
        consolidator: {} as never,
        async status() {
          return {
            tier: 'cheap',
            running: true,
            paused: false,
            queueDepth: 7,
            dlqSize: 3,
            deferredRuns: 0,
            emptyExtractions: 0,
            budget: {
              tokensUsedToday: 1_000,
              costUsedToday: 0.5,
              tokensRemaining: 49_000,
              costRemaining: 1.5,
              resetAt: new Date(0).toISOString(),
            },
          };
        },
      },
    });
    expect(summary.status).toBe('degraded');
    expect(summary.checks.consolidator?.status).toBe('warn');
    expect(summary.checks.consolidator).toMatchObject({
      tier: 'cheap',
      queueDepth: 7,
      dlqSize: 3,
      budgetRemaining: { tokens: 49_000, costUsd: 1.5 },
    });
  });

  it('records consolidator failure when status() throws', async () => {
    const summary = await collectHealth({
      consolidator: {
        async start() {},
        async stop() {},
        consolidator: {} as never,
        async status() {
          throw new Error('store unavailable');
        },
      },
    });
    expect(summary.status).toBe('failing');
    expect(summary.checks.consolidator?.status).toBe('fail');
    expect(summary.checks.consolidator?.message).toBe('store unavailable');
  });

  it('surfaces the triggers orphaned count on the health check (SERVER-DO-01)', async () => {
    const summary = await collectHealth({
      triggers: {
        async start() {},
        async stop() {},
        metrics: () => ({}) as never,
        scheduler: {} as never,
        async status() {
          return {
            running: true,
            active: 2,
            disabled: 1,
            deferred: 0,
            orphaned: 3,
          };
        },
      },
    });
    expect(summary.checks.triggers?.status).toBe('ok');
    // The daemon reports orphaned; the health check must copy it, not drop it.
    expect(summary.checks.triggers?.orphaned).toBe(3);
  });

  it('reports orphaned:0 when the triggers status() throws (SERVER-DO-01)', async () => {
    const summary = await collectHealth({
      triggers: {
        async start() {},
        async stop() {},
        metrics: () => ({}) as never,
        scheduler: {} as never,
        async status() {
          throw new Error('daemon offline');
        },
      },
    });
    expect(summary.checks.triggers?.status).toBe('fail');
    expect(summary.checks.triggers?.orphaned).toBe(0);
  });
});
