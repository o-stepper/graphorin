import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import {
  _resetLibModeWarningForTesting,
  createScheduler,
  interval,
  type Scheduler,
} from '@graphorin/triggers';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTriggersDaemon } from '../src/triggers/daemon.js';

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
}

let store: GraphorinSqliteStore;
let scheduler: Scheduler;
let clock: FakeClock;

beforeEach(async () => {
  _resetLibModeWarningForTesting();
  clock = new FakeClock();
  store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  await store.init();
  scheduler = createScheduler({
    store: store.triggers,
    mode: 'server',
    now: clock.now,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  });
});

afterEach(async () => {
  await scheduler.stop().catch(() => {});
  await store.close().catch(() => {});
});

describe('TriggersDaemon', () => {
  it('start() / stop() lifecycle is idempotent', async () => {
    const daemon = createTriggersDaemon({ scheduler, warn: () => {} });
    await daemon.start();
    await daemon.start();
    let status = await daemon.status();
    expect(status.running).toBe(true);
    await daemon.stop();
    await daemon.stop();
    status = await daemon.status();
    expect(status.running).toBe(false);
  });

  it('status() reports active vs disabled triggers + last fire timestamp', async () => {
    const daemon = createTriggersDaemon({ scheduler, warn: () => {} });
    await daemon.start();
    let fired = 0;
    await scheduler.register(
      interval('demo', 1_000, async () => {
        fired += 1;
      }),
    );
    await scheduler.register(interval('disabled-demo', 5_000, async () => {}));
    await store.triggers.upsert({
      id: 'disabled-demo',
      kind: 'interval',
      spec: '5000',
      callbackRef: 'disabled-demo',
      missedFires: 0,
      disabled: true,
      catchupPolicy: 'none',
      maxCatchupRuns: 1,
      catchupWindowMs: 86_400_000,
      createdAt: new Date(0).toISOString(),
    });
    await clock.advance(1_500);
    expect(fired).toBeGreaterThan(0);
    const status = await daemon.status();
    expect(status.active).toBeGreaterThan(0);
    expect(status.disabled).toBe(1);
    expect(status.lastFireAt).toBeDefined();
    await daemon.stop();
  });

  it('records per-trigger success / error metrics from scheduler events', async () => {
    const daemon = createTriggersDaemon({ scheduler, warn: () => {} });
    await daemon.start();
    let invocations = 0;
    await scheduler.register(
      interval('flaky', 1_000, async () => {
        invocations += 1;
        if (invocations === 1) {
          throw new Error('boom');
        }
      }),
    );
    await clock.advance(1_500);
    await clock.advance(1_500);
    const metrics = daemon.metrics();
    const flaky = metrics.fires.get('flaky');
    expect(flaky).toBeDefined();
    expect(flaky?.error).toBeGreaterThan(0);
    await daemon.stop();
  });
});
