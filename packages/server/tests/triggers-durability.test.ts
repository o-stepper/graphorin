/**
 * Triggers durability — simulate a daemon restart by:
 *
 *   1. Booting an in-memory `TriggerStore` with a clock-controlled
 *      `Scheduler`.
 *   2. Registering a cron trigger; advancing the clock past one fire.
 *   3. Stopping the scheduler (process restart proxy).
 *   4. Building a fresh scheduler against the same store with a clock
 *      that already moved past the next-fire boundary.
 *   5. Asserting that the per-trigger `catchupPolicy` produced the
 *      expected catch-up behaviour:
 *      - `'none'` (default): zero re-fires; advance only.
 *      - `'last'`: exactly one catch-up fire.
 *      - `'all'`: up to `maxCatchupRuns` catch-up fires (default 1).
 */

import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import {
  _resetLibModeWarningForTesting,
  type CatchupPolicy,
  createScheduler,
  cron,
  type Scheduler,
  type SchedulerEvent,
} from '@graphorin/triggers';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTriggersDaemon, type TriggersDaemon } from '../src/triggers/daemon.js';

interface FakeTimer {
  readonly id: number;
  readonly fireAt: number;
  readonly cb: () => void;
}

class FakeClock {
  #now = 0;
  #pending: FakeTimer[] = [];
  #nextId = 1;

  constructor(epochMs: number) {
    this.#now = epochMs;
  }

  now = (): number => this.#now;

  setTimeout = (cb: () => void, ms: number): unknown => {
    const id = this.#nextId++;
    this.#pending.push({ id, fireAt: this.#now + ms, cb });
    this.#pending.sort((a, b) => a.fireAt - b.fireAt);
    return id;
  };

  clearTimeout = (handle: unknown): void => {
    const id = handle as number;
    this.#pending = this.#pending.filter((t) => t.id !== id);
  };

  /** Move time without firing any timers. Simulates an offline window. */
  jump(ms: number): void {
    this.#now += ms;
  }

  async advance(ms: number): Promise<void> {
    const target = this.#now + ms;
    while (this.#pending.length > 0 && this.#pending[0]!.fireAt <= target) {
      const next = this.#pending.shift()!;
      this.#now = next.fireAt;
      next.cb();
      await Promise.resolve();
    }
    this.#now = target;
  }
}

let store: GraphorinSqliteStore;

beforeEach(async () => {
  _resetLibModeWarningForTesting();
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

interface RestartContext {
  readonly fired: ReadonlyArray<number>;
  readonly catchupApplied: number;
  readonly daemon: TriggersDaemon;
  readonly scheduler: Scheduler;
}

async function bootDaemon(args: {
  readonly clock: FakeClock;
  readonly catchupPolicy: CatchupPolicy;
  readonly maxCatchupRuns?: number;
  readonly catchupWindowMs?: number;
  readonly fires: number[];
}): Promise<RestartContext> {
  const scheduler = createScheduler({
    store: store.triggers,
    mode: 'server',
    now: args.clock.now,
    setTimeout: args.clock.setTimeout,
    clearTimeout: args.clock.clearTimeout,
  });
  const daemon = createTriggersDaemon({ scheduler, warn: () => {} });

  let catchupApplied = 0;
  void (async () => {
    for await (const event of scheduler.events() as AsyncIterable<SchedulerEvent>) {
      if (event.type === 'catchup-applied') catchupApplied += event.missed;
    }
  })();

  await scheduler.register(
    cron(
      'morning-digest',
      '0 8 * * *',
      async () => {
        args.fires.push(args.clock.now());
      },
      {
        catchupPolicy: args.catchupPolicy,
        ...(args.maxCatchupRuns !== undefined ? { maxCatchupRuns: args.maxCatchupRuns } : {}),
        ...(args.catchupWindowMs !== undefined ? { catchupWindowMs: args.catchupWindowMs } : {}),
      },
    ),
  );
  await daemon.start();
  return { fired: args.fires, catchupApplied, daemon, scheduler };
}

describe('Triggers durability — simulated daemon restart', () => {
  it("catchupPolicy: 'none' (default) drops missed firings on restart", async () => {
    const fires: number[] = [];
    // Start at 2026-05-09 07:00:00 UTC (one hour before the 08:00 cron).
    const epoch = Date.UTC(2026, 4, 9, 7, 0, 0);

    const clock1 = new FakeClock(epoch);
    const ctx1 = await bootDaemon({ clock: clock1, catchupPolicy: 'none', fires });
    // Advance to 09:00 — first cron fire happens at 08:00.
    await clock1.advance(2 * 60 * 60 * 1000);
    expect(fires).toHaveLength(1);
    await ctx1.daemon.stop();

    // Daemon offline for 36h — would miss 1 cron fire (next day 08:00).
    const clock2 = new FakeClock(clock1.now() + 36 * 60 * 60 * 1000);
    const ctx2 = await bootDaemon({ clock: clock2, catchupPolicy: 'none', fires });
    // Don't advance — catchup with 'none' should not have fired anything.
    expect(fires).toHaveLength(1);
    expect(ctx2.catchupApplied).toBe(0);
    await ctx2.daemon.stop();
  });

  it("catchupPolicy: 'last' fires exactly once on restart after offline gap (within window)", async () => {
    const fires: number[] = [];
    const epoch = Date.UTC(2026, 4, 9, 7, 0, 0);

    const clock1 = new FakeClock(epoch);
    const ctx1 = await bootDaemon({
      clock: clock1,
      catchupPolicy: 'last',
      catchupWindowMs: 24 * 60 * 60 * 1000,
      fires,
    });
    await clock1.advance(2 * 60 * 60 * 1000);
    expect(fires).toHaveLength(1);
    await ctx1.daemon.stop();

    // Offline for 12h — well inside the 24h catch-up window so the
    // 'last' policy must fire exactly once on restart.
    const clock2 = new FakeClock(clock1.now() + 12 * 60 * 60 * 1000);
    const before = fires.length;
    const ctx2 = await bootDaemon({
      clock: clock2,
      catchupPolicy: 'last',
      catchupWindowMs: 24 * 60 * 60 * 1000,
      fires,
    });
    await clock2.advance(0);
    await new Promise((r) => setTimeout(r, 10));
    expect(fires.length - before).toBe(1);
    await ctx2.daemon.stop();
  });

  it("catchupPolicy: 'all' caps at maxCatchupRuns regardless of offline gap", async () => {
    const fires: number[] = [];
    const epoch = Date.UTC(2026, 4, 9, 7, 0, 0);

    const clock1 = new FakeClock(epoch);
    const ctx1 = await bootDaemon({
      clock: clock1,
      catchupPolicy: 'all',
      maxCatchupRuns: 1,
      catchupWindowMs: 7 * 24 * 60 * 60 * 1000,
      fires,
    });
    await clock1.advance(2 * 60 * 60 * 1000);
    expect(fires).toHaveLength(1);
    await ctx1.daemon.stop();

    // Offline for 5 days — would miss ~5 cron fires; cap at maxCatchupRuns=1.
    const clock2 = new FakeClock(clock1.now() + 5 * 24 * 60 * 60 * 1000);
    const before = fires.length;
    const ctx2 = await bootDaemon({
      clock: clock2,
      catchupPolicy: 'all',
      maxCatchupRuns: 1,
      catchupWindowMs: 7 * 24 * 60 * 60 * 1000,
      fires,
    });
    await clock2.advance(0);
    await new Promise((r) => setTimeout(r, 10));
    expect(fires.length - before).toBe(1);
    await ctx2.daemon.stop();
  });
});
