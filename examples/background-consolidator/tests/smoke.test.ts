import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/background-consolidator`. Every test
 * runs against `:memory:` SQLite + the deterministic stub provider so
 * CI never touches a network socket. The four scenarios cover:
 *
 *  1. Canonical version constant.
 *  2. {@link runConsolidatorCycle} drives a few synthetic turns,
 *     fires the registered light-tick interval trigger
 *     deterministically, and returns ≥ 1 completed `light` phase
 *     within the soft budget.
 *  3. Trigger durability across simulated restart (DEC-150) - the
 *     SQLite `TriggerStore` is the durable layer, so a fresh
 *     `Scheduler` sharing the same store re-discovers the persisted
 *     trigger rows after the previous scheduler stopped.
 *  4. Direct `interval(...)` registration + deterministic
 *     `scheduler.fire(...)` increments the consolidator's `light`
 *     phase counter without waiting on wall-clock time.
 */

import { createSqliteStore } from '@graphorin/store-sqlite';
import { _resetLibModeWarningForTesting, createScheduler, interval } from '@graphorin/triggers';
import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_TICK_TRIGGER_ID,
  createBackgroundConsolidatorApp,
  IDLE_PROBE_TRIGGER_ID,
  resolveContextWindow,
  runConsolidatorCycle,
  VERSION,
} from '../src/main.js';

describe('examples/background-consolidator - smoke', () => {
  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('arms auto-compaction with a provider context window (CE-12 regression)', async () => {
    expect(resolveContextWindow({})).toBe(8_192);
    expect(resolveContextWindow({ GRAPHORIN_CONTEXT_WINDOW: '4096' })).toBe(4_096);
    expect(() => resolveContextWindow({ GRAPHORIN_CONTEXT_WINDOW: 'nope' })).toThrow(
      /GRAPHORIN_CONTEXT_WINDOW/,
    );
    const app = await createBackgroundConsolidatorApp({ dbPath: ':memory:' });
    try {
      const config = app.memory.contextEngine.config();
      expect(config.providerContextWindow).toBe(8_192);
      expect(config.compactionEffective).toBe(true);
    } finally {
      await app.close();
    }
  }, 15_000);

  it('runConsolidatorCycle drives turns + fires the light-tick deterministically', async () => {
    _resetLibModeWarningForTesting();
    const startedAt = Date.now();
    const app = await createBackgroundConsolidatorApp({
      recipe: 'stub',
      dbPath: ':memory:',
      userId: 'smoke-operator',
      sessionId: 'smoke-session',
      agentId: 'smoke-agent',
      // Generous interval so wall-clock cron never wins the race
      // against `scheduler.fire(...)` inside the test.
      lightTickIntervalMs: 60_000,
      idleProbeMs: 60_000,
    });
    try {
      const cycle = await runConsolidatorCycle({
        app,
        turns: 3,
        durationMs: 250,
      });
      expect(Date.now() - startedAt).toBeLessThan(5_000);
      expect(cycle.turnsDriven).toBe(3);
      // The light phase ran at least once via either the per-turn
      // `consolidator.trigger({ kind: 'turn' })` calls or the
      // deterministic `scheduler.fire(BACKGROUND_TICK_TRIGGER_ID)`.
      expect(cycle.eventCounts.consolidatorPhases.light).toBeGreaterThanOrEqual(1);
      expect(cycle.eventCounts.schedulerFires).toBeGreaterThanOrEqual(1);
      expect(cycle.eventCounts.schedulerErrors).toBe(0);
      expect(cycle.status.tier).toBe('cheap');
      expect(cycle.status.running).toBe(true);
      expect(cycle.status.lastRuns.light).toBeDefined();
      // Spec ids registered by `registerConsolidatorTriggers` (cron
      // + idle parsed from the consolidator's trigger list) plus
      // the operator-owned interval + idle declarations.
      const ids = cycle.snapshot.map((t) => t.id);
      expect(ids).toContain(BACKGROUND_TICK_TRIGGER_ID);
      expect(ids).toContain(IDLE_PROBE_TRIGGER_ID);
      expect(ids).toContain('consolidator:cron:0 3 * * *');
      expect(ids).toContain('consolidator:idle:10s');
    } finally {
      await app.close();
    }
  }, 10_000);

  it('TriggerStore survives simulated restart (DEC-150)', async () => {
    _resetLibModeWarningForTesting();
    const store = await createSqliteStore({
      path: ':memory:',
      disableWalHardening: true,
    });
    await store.init();
    const scheduler1 = createScheduler({
      store: store.triggers,
      mode: 'lib',
    });
    const restartId = 'restart-survivor';
    await scheduler1.register(
      interval(restartId, 60_000, async () => {}, { acknowledgeLibMode: true }),
    );
    await scheduler1.start();
    const persistedAfterFirst = await scheduler1.list();
    expect(persistedAfterFirst.find((t) => t.id === restartId)).toBeDefined();
    await scheduler1.stop();

    // Simulated restart: brand-new Scheduler instance, same
    // durable `TriggerStore`. The persisted rows survive process
    // restart per DEC-150.
    const scheduler2 = createScheduler({
      store: store.triggers,
      mode: 'lib',
    });
    const persistedAfterRestart = await scheduler2.list();
    const survivor = persistedAfterRestart.find((t) => t.id === restartId);
    expect(survivor).toBeDefined();
    expect(survivor?.kind).toBe('interval');
    expect(survivor?.spec).toBe('60000');
    await scheduler2.stop();
    await store.close();
  }, 10_000);

  it('interval trigger fired via scheduler.fire() increments the consolidator phase counter', async () => {
    _resetLibModeWarningForTesting();
    const app = await createBackgroundConsolidatorApp({
      recipe: 'stub',
      dbPath: ':memory:',
      userId: 'fire-operator',
      sessionId: 'fire-session',
      agentId: 'fire-agent',
      lightTickIntervalMs: 60_000,
      idleProbeMs: 60_000,
    });
    try {
      let lightPhaseCount = 0;
      const unsubscribe = app.memory.consolidator.onPhaseFinished((outcome) => {
        if (
          outcome.phase === 'light' &&
          (outcome.status === 'completed' || outcome.status === 'partial')
        ) {
          lightPhaseCount += 1;
        }
      });

      const triggerId = 'smoke-fire-tick';
      await app.scheduler.register(
        interval(
          triggerId,
          60_000,
          async () => {
            await app.memory.consolidator.fireNow('light', app.scope);
          },
          { acknowledgeLibMode: true },
        ),
      );

      const before = await app.memory.consolidator.status();
      expect(before.lastRuns.light).toBeUndefined();

      // Deterministic single fire.
      await app.scheduler.fire(triggerId);
      // Second fire - counter must increment again.
      await app.scheduler.fire(triggerId);

      unsubscribe();
      const after = await app.memory.consolidator.status();
      expect(lightPhaseCount).toBeGreaterThanOrEqual(2);
      expect(after.lastRuns.light).toBeDefined();
      const persisted = await app.scheduler.list();
      expect(persisted.find((t) => t.id === triggerId)?.lastFiredAt).toBeDefined();
    } finally {
      await app.close();
    }
  }, 10_000);
});
