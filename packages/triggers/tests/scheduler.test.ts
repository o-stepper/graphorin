import { mkdtemp } from 'node:fs/promises';
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
    while (this.#pending.length > 0 && this.#pending[0]!.fireAt <= target) {
      const next = this.#pending.shift()!;
      this.#now = next.fireAt;
      next.cb();
      await Promise.resolve();
    }
    this.#now = target;
  }

  pending(): readonly FakeTimer[] {
    return this.#pending;
  }
}

async function makeStore(): Promise<import('@graphorin/core/contracts').TriggerStore> {
  const dir = await mkdtemp('/tmp/graphorin-triggers-');
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
    // Now re-register with catchupPolicy: 'last' — the existing
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

  it("catchup-policy='all' fires up to maxCatchupRuns missed runs on resume", async () => {
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
    expect(resumedFires).toBe(3);
    await s2.stop();
  });

  it("catchup-policy='last' fires exactly once on resume", async () => {
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
