import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { collectHealth, rollup } from '../src/health/checks.js';

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
    expect(rollup({})).toBe('ok');
    expect(rollup({ storage: { status: 'ok' } })).toBe('ok');
    expect(rollup({ storage: { status: 'warn' } })).toBe('degraded');
    expect(
      rollup({
        storage: { status: 'warn' },
        consolidator: { status: 'fail' },
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
});
