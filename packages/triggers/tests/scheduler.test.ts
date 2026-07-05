import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetLibModeWarningForTesting,
  createScheduler,
  cron,
  event,
  idle,
  interval,
  type Scheduler,
  type SchedulerEvent,
} from '../src/index.js';

interface FakeTimer {
  readonly id: number;
  readonly fireAt: number;
  readonly cb: () => void;
}

class FakeClock {
  #now = 0;
  #pending: FakeTimer[] = [];
  #nextId = 1;

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

  async advance(ms: number): Promise<void> {
    const target = this.#now + ms;
    for (;;) {
      // Drain microtask chains (async fire() bodies are several awaits
      // deep over the sync-sqlite store) so timers they arm participate
      // in this same advance - otherwise a re-arm lands after the scan
      // and periodic triggers appear dead.
      await this.#settle();
      const next = this.#pending[0];
      if (next === undefined || next.fireAt > target) break;
      this.#pending.shift();
      this.#now = next.fireAt;
      next.cb();
    }
    this.#now = target;
    await this.#settle();
  }

  async #settle(): Promise<void> {
    for (let i = 0; i < 25; i++) await Promise.resolve();
  }

  pending(): readonly FakeTimer[] {
    return this.#pending;
  }
}

async function makeStore(): Promise<import('@graphorin/core/contracts').TriggerStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-triggers-'));
  const { createSqliteStore } = await import('@graphorin/store-sqlite');
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    skipSqliteVec: true,
  });
  await store.init();
  return store.triggers;
}

describe('Scheduler', () => {
  let scheduler: Scheduler;
  let clock: FakeClock;

  beforeEach(async () => {
    _resetLibModeWarningForTesting();
    clock = new FakeClock();
    const triggerStore = await makeStore();
    scheduler = createScheduler({
      store: triggerStore,
      mode: 'server', // suppress lib-mode warn in most tests
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
  });

  afterEach(async () => {
    await scheduler.stop();
  });

  it('register + start fires an interval trigger after the interval elapses', async () => {
    let count = 0;
    const t = interval('poll', 1_000, () => {
      count++;
    });
    await scheduler.register(t);
    await scheduler.start();
    await clock.advance(1_500);
    expect(count).toBe(1);
  });

  it('register + start fires a cron trigger at the next minute', async () => {
    let count = 0;
    const t = cron('every-minute', '* * * * *', () => {
      count++;
    });
    await scheduler.register(t);
    await scheduler.start();
    // Advance to the next minute boundary.
    await clock.advance(60_000);
    expect(count).toBe(1);
  });

  it('idle trigger fires after idleMs of inactivity, resets via recordActivity', async () => {
    let count = 0;
    const t = idle('idle-flush', 5_000, () => {
      count++;
    });
    await scheduler.register(t);
    await scheduler.start();

    await clock.advance(2_000);
    scheduler.recordActivity();
    await clock.advance(2_000);
    expect(count).toBe(0);
    await clock.advance(5_000);
    expect(count).toBe(1);
  });

  it('event trigger fires when emit() matches', async () => {
    const seen: unknown[] = [];
    const t = event('on-handoff', 'session.handoff', (payload) => {
      seen.push(payload);
    });
    await scheduler.register(t);
    await scheduler.start();
    await scheduler.emit('session.handoff', { from: 'a', to: 'b' });
    expect(seen).toEqual([{ from: 'a', to: 'b' }]);
  });

  it('events() AsyncIterable surfaces fire-start / fire-end', async () => {
    const t = interval('poll', 1_000, () => undefined);
    await scheduler.register(t);
    await scheduler.start();
    const seen: SchedulerEvent[] = [];
    const iter = scheduler.events()[Symbol.asyncIterator]();
    const consumer = (async () => {
      for (let i = 0; i < 5; i++) {
        const result = await iter.next();
        if (result.done) break;
        seen.push(result.value);
      }
    })();
    await clock.advance(1_500);
    await Promise.race([consumer, new Promise((r) => setTimeout(r, 50))]);
    const types = seen.map((e) => e.type);
    expect(types).toContain('fire-start');
    expect(types).toContain('fire-end');
  });

  it('lib mode emits a one-time WARN on the first register call', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const triggerStore = await makeStore();
    const libScheduler = createScheduler({
      store: triggerStore,
      mode: 'lib',
      _resetLibModeFlag: true,
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await libScheduler.register(interval('first', 1_000, () => undefined));
    await libScheduler.register(interval('second', 1_000, () => undefined));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('library mode');
    warn.mockRestore();
    await libScheduler.stop();
  });

  it('lib mode WARN is suppressed when acknowledgeLibMode: true on the first registration', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const triggerStore = await makeStore();
    const libScheduler = createScheduler({
      store: triggerStore,
      mode: 'lib',
      _resetLibModeFlag: true,
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await libScheduler.register(
      interval('first', 1_000, () => undefined, { acknowledgeLibMode: true }),
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    await libScheduler.stop();
  });

  it('catchup-policy=last fires once on resume when a fire was missed', async () => {
    let count = 0;
    const t = cron('cron-last', '0 9 * * *', () => {
      count++;
    });
    // First register + simulate one previous fire.
    await scheduler.register(t);
    await scheduler.start();
    // Force a fire (records lastFiredAt).
    await scheduler.fire('cron-last');
    expect(count).toBe(1);

    await scheduler.stop();
    // Now re-register with catchupPolicy: 'last' - the existing
    // record indicates a previous fire within the catchupWindow, so
    // 'last' adds one extra fire on resume.
    const triggerStore2 = await makeStore();
    const fresh = createScheduler({
      store: triggerStore2,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    let count2 = 0;
    await fresh.register(
      cron(
        'cron-fresh',
        '0 9 * * *',
        () => {
          count2++;
        },
        { catchupPolicy: 'none' },
      ),
    );
    expect(count2).toBe(0);
    await fresh.stop();
  });

  it("interval + catchupPolicy 'none' does NOT fire immediately after a restart (periphery-11)", async () => {
    // First process: register, fire once (records lastFiredAt), stop.
    const sharedStore = await makeStore();
    const first = createScheduler({
      store: sharedStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    let count1 = 0;
    await first.register(
      interval('beat', 1_000, () => {
        count1++;
      }),
    );
    await first.start();
    await clock.advance(1_000);
    expect(count1).toBe(1);
    await first.stop();

    // Downtime: several boundaries pass.
    await clock.advance(10_500);

    // Second process re-registers over the SAME persisted state with
    // 'none' ("drop missed fires"). Pre-fix `last + interval` was in
    // the past and the schedule clamp fired IMMEDIATELY on startup.
    const second = createScheduler({
      store: sharedStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    let count2 = 0;
    await second.register(
      interval(
        'beat',
        1_000,
        () => {
          count2++;
        },
        { catchupPolicy: 'none' },
      ),
    );
    await second.start();
    // No immediate fire...
    await clock.advance(0);
    expect(count2).toBe(0);
    // ...the next FUTURE boundary on the original cadence fires.
    await clock.advance(1_000);
    expect(count2).toBe(1);
    await second.stop();
  });

  it('recordActivity on a stopped scheduler never arms idle timers (P-14)', async () => {
    let fired = 0;
    const libScheduler2 = createScheduler({
      store: await makeStore(),
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    const { idle } = await import('../src/index.js');
    await libScheduler2.register(
      idle('idle-1', 1_000, () => {
        fired++;
      }),
    );
    // NOT started: activity must not arm a timer.
    libScheduler2.recordActivity();
    await clock.advance(5_000);
    expect(fired).toBe(0);
    await libScheduler2.start();
    libScheduler2.recordActivity();
    await clock.advance(1_000);
    expect(fired).toBe(1);
    await libScheduler2.stop();
    // Stopped again: re-arming is refused.
    libScheduler2.recordActivity();
    await clock.advance(5_000);
    expect(fired).toBe(1);
  });

  it('unregister removes the timer', async () => {
    let count = 0;
    const t = interval('poll', 1_000, () => {
      count++;
    });
    await scheduler.register(t);
    await scheduler.start();
    await scheduler.unregister('poll');
    await clock.advance(2_000);
    expect(count).toBe(0);
  });

  it('list returns persisted state', async () => {
    await scheduler.register(interval('poll', 1_000, () => undefined));
    const list = await scheduler.list();
    expect(list.length).toBe(1);
    expect(list[0]?.kind).toBe('interval');
  });

  it('cron expression with malformed syntax fails fast at register time', () => {
    expect(() => cron('bad', 'not-a-cron', () => undefined)).toThrow();
  });

  it('interval(0) rejects', () => {
    expect(() => interval('zero', 0, () => undefined)).toThrow();
  });

  it('idle(0) rejects', () => {
    expect(() => idle('zero', 0, () => undefined)).toThrow();
  });

  it('event(empty) rejects', () => {
    expect(() => event('zero', '', () => undefined)).toThrow();
  });

  it("catchup-policy='all' fires min(missed, maxCatchupRuns) REAL missed runs on resume (RP-12)", async () => {
    const triggerStore = await makeStore();
    const s1 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    let initialFires = 0;
    await s1.register(
      cron('cron-all', '0 9 * * *', () => {
        initialFires++;
      }),
    );
    await s1.start();
    await s1.fire('cron-all');
    expect(initialFires).toBe(1);
    await s1.stop();

    // Five 09:00 boundaries pass while the scheduler is offline
    // (epoch t=0 → boundaries at 9h/33h/57h/81h/105h ≤ 106h).
    await clock.advance(4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000);

    let resumedFires = 0;
    const s2 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s2.register(
      cron(
        'cron-all',
        '0 9 * * *',
        () => {
          resumedFires++;
        },
        {
          catchupPolicy: 'all',
          maxCatchupRuns: 3,
          catchupWindowMs: 7 * 24 * 60 * 60 * 1000,
        },
      ),
    );
    await s2.start();
    // 5 real misses, capped at maxCatchupRuns=3; the excess lands in missedFires.
    expect(resumedFires).toBe(3);
    const st = await triggerStore.get('cron-all');
    expect(st?.missedFires).toBe(2);
    await s2.stop();
  });

  it("catchup-policy='last' fires exactly once on resume IFF a boundary was crossed (RP-12)", async () => {
    const triggerStore = await makeStore();
    const s1 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s1.register(cron('cron-last', '0 9 * * *', () => undefined));
    await s1.start();
    await s1.fire('cron-last');
    await s1.stop();

    // One 09:00 boundary passes offline (inside the default 24h window).
    await clock.advance(10 * 60 * 60 * 1000);

    let resumedFires = 0;
    const s2 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s2.register(
      cron(
        'cron-last',
        '0 9 * * *',
        () => {
          resumedFires++;
        },
        { catchupPolicy: 'last' },
      ),
    );
    await s2.start();
    expect(resumedFires).toBe(1);
    await s2.stop();
  });

  it('restart with ZERO missed fires applies zero catch-up (RP-12)', async () => {
    const triggerStore = await makeStore();
    const s1 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s1.register(cron('cron-none-missed', '0 9 * * *', () => undefined));
    await s1.start();
    await s1.fire('cron-none-missed');
    await s1.stop();

    // Restart five minutes later - no 09:00 boundary crossed.
    await clock.advance(5 * 60 * 1000);

    let resumedFires = 0;
    const s2 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s2.register(
      cron(
        'cron-none-missed',
        '0 9 * * *',
        () => {
          resumedFires++;
        },
        { catchupPolicy: 'last' },
      ),
    );
    await s2.start();
    expect(resumedFires).toBe(0);
    await s2.stop();
  });

  it('interval triggers participate in catch-up (RP-12)', async () => {
    const triggerStore = await makeStore();
    const s1 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s1.register(interval('hourly', 60 * 60 * 1000, () => undefined));
    await s1.start();
    await s1.fire('hourly');
    await s1.stop();

    // 3 intervals pass offline.
    await clock.advance(3 * 60 * 60 * 1000 + 60_000);

    let resumedFires = 0;
    const s2 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s2.register(
      interval(
        'hourly',
        60 * 60 * 1000,
        () => {
          resumedFires++;
        },
        { catchupPolicy: 'all', maxCatchupRuns: 2, catchupWindowMs: 24 * 60 * 60 * 1000 },
      ),
    );
    await s2.start();
    expect(resumedFires).toBe(2);
    const st = await triggerStore.get('hourly');
    expect(st?.missedFires).toBe(1);
    await s2.stop();
  });

  it('persists state across simulated process restart', async () => {
    const triggerStore = await makeStore();
    let count = 0;
    const s1 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s1.register(
      cron(
        'daily',
        '0 9 * * *',
        () => {
          count++;
        },
        { catchupPolicy: 'last' },
      ),
    );
    await s1.start();
    await s1.fire('daily');
    expect(count).toBe(1);
    await s1.stop();

    const after1 = await triggerStore.list();
    expect(after1.length).toBe(1);
    expect(after1[0]?.lastFiredAt).toBeDefined();

    const s2Calls: number[] = [];
    const s2 = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await s2.register(
      cron(
        'daily',
        '0 9 * * *',
        () => {
          s2Calls.push(clock.now());
        },
        { catchupPolicy: 'none' },
      ),
    );
    await s2.start();
    const after2 = await triggerStore.list();
    expect(after2.length).toBe(1);
    expect(after2[0]?.id).toBe('daily');
    expect(s2Calls.length).toBe(0);
    await s2.stop();
  });

  it('fire surfaces the error via fire-error event', async () => {
    let errors = 0;
    const t = interval('flaky', 1_000, () => {
      throw new Error('boom');
    });
    await scheduler.register(t);
    await scheduler.start();
    const iter = scheduler.events()[Symbol.asyncIterator]();
    void (async () => {
      for await (const ev of { [Symbol.asyncIterator]: () => iter }) {
        if (ev.type === 'fire-error') {
          errors++;
          if (errors >= 1) break;
        }
      }
    })();
    await clock.advance(1_500);
    await new Promise((r) => setTimeout(r, 20));
    expect(errors).toBeGreaterThanOrEqual(1);
  });
});

describe('scheduler correctness - RP-13/14/15', () => {
  let clock: FakeClock;
  let triggerStore: import('@graphorin/core/contracts').TriggerStore;
  let scheduler: Scheduler;

  beforeEach(async () => {
    _resetLibModeWarningForTesting();
    clock = new FakeClock();
    triggerStore = await makeStore();
    scheduler = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
  });

  afterEach(async () => {
    await scheduler.stop();
  });

  it('RP-13: an interval trigger fires exactly once per period across 3 periods', async () => {
    let count = 0;
    await scheduler.register(
      interval('beat', 1_000, () => {
        count++;
      }),
    );
    await scheduler.start();
    await clock.advance(1_000);
    expect(count).toBe(1);
    await clock.advance(1_000);
    expect(count).toBe(2);
    await clock.advance(1_000);
    expect(count).toBe(3);
  });

  it('RP-14: a throwing callback does not kill the trigger - it fires again next period', async () => {
    let calls = 0;
    await scheduler.register(
      interval('flaky', 1_000, () => {
        calls++;
        if (calls === 1) throw new Error('transient network failure');
      }),
    );
    await scheduler.start();
    await clock.advance(1_000);
    expect(calls).toBe(1);
    // The error must not consume the trigger: state carries a FUTURE
    // nextFireAt and the timer is re-armed.
    const st = await triggerStore.get('flaky');
    expect(st?.nextFireAt).toBeDefined();
    expect(Date.parse(st?.nextFireAt ?? '')).toBeGreaterThan(clock.now());
    await clock.advance(1_000);
    expect(calls).toBe(2);
  });

  it('RP-14: the failed fire does NOT advance lastFiredAt', async () => {
    let calls = 0;
    await scheduler.register(
      interval('flaky2', 1_000, () => {
        calls++;
        throw new Error('always fails');
      }),
    );
    await scheduler.start();
    await clock.advance(1_000);
    const st = await triggerStore.get('flaky2');
    // No successful fire was recorded.
    expect(st?.lastFiredAt).toBeUndefined();
    expect(calls).toBe(1);
  });

  it('RP-15: a delay beyond 2^31-1 ms arms a chunked wake-up, never a clamped timer', async () => {
    const MAX_TIMEOUT = 2 ** 31 - 1;
    const FORTY_DAYS = 40 * 24 * 60 * 60 * 1000;
    let count = 0;
    await scheduler.register(
      interval('quarterly-ish', FORTY_DAYS, () => {
        count++;
      }),
    );
    await scheduler.start();
    // The scheduler must never hand the platform a delay that Node
    // would clamp to 1 ms (the hot-loop bug).
    for (const t of clock.pending()) {
      expect(t.fireAt - clock.now()).toBeLessThanOrEqual(MAX_TIMEOUT);
    }
    // The intermediate wake-up re-arms without firing.
    await clock.advance(MAX_TIMEOUT);
    expect(count).toBe(0);
    for (const t of clock.pending()) {
      expect(t.fireAt - clock.now()).toBeLessThanOrEqual(MAX_TIMEOUT);
    }
    // The real boundary fires exactly once.
    await clock.advance(FORTY_DAYS - MAX_TIMEOUT);
    expect(count).toBe(1);
  });
});

describe('setDisabled - flag flip, not removal (IP-17)', () => {
  it('disable stops firing but keeps the trigger; enable re-arms from now', async () => {
    _resetLibModeWarningForTesting();
    const clock = new FakeClock();
    const triggerStore = await makeStore();
    const scheduler = createScheduler({
      store: triggerStore,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    let count = 0;
    await scheduler.register(
      interval('toggler', 1_000, () => {
        count++;
      }),
    );
    await scheduler.start();
    await clock.advance(1_000);
    expect(count).toBe(1);

    const disabled = await scheduler.setDisabled('toggler', true);
    expect(disabled.disabled).toBe(true);
    await clock.advance(5_000);
    expect(count).toBe(1); // silent while disabled
    // Still registered + persisted (NOT unregistered).
    expect((await scheduler.list()).some((t) => t.id === 'toggler')).toBe(true);

    const enabled = await scheduler.setDisabled('toggler', false);
    expect(enabled.disabled).toBe(false);
    // Re-armed from now - no immediate stale-nextFireAt fire.
    expect(count).toBe(1);
    await clock.advance(1_000);
    expect(count).toBe(2);
    await scheduler.stop();
  });
});
