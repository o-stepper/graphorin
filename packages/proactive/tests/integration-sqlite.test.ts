import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAgent } from '@graphorin/agent';
import type { ProactiveOutcome } from '@graphorin/core';
import { createScheduler } from '@graphorin/triggers';
import { describe, expect, it } from 'vitest';
import { createHeartbeat } from '../src/index.js';
import { createMockProvider, FakeClock, textScript, waitFor } from './helpers.js';

/**
 * End-to-end over the REAL trigger scheduler + SQLite trigger store:
 * heartbeat.start() registers the declaration, the scheduler arms it
 * on the fake clock, the fire runs a real agent and the outcome lands
 * on the observer. The C4 harness (limits) is active to prove the
 * composition passes its floor.
 */
describe('heartbeat over a real scheduler + sqlite store', () => {
  it('fires on schedule and delivers a notify outcome', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-proactive-'));
    const { createSqliteStore } = await import('@graphorin/store-sqlite');
    const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
    await store.init();

    const clock = new FakeClock();
    const scheduler = createScheduler({
      store: store.triggers,
      mode: 'server',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      limits: {}, // C4 harness on: 60s floor
    });

    const provider = createMockProvider({
      modelId: 'mock-e2e',
      scripts: [textScript('HEARTBEAT_OK The morning digest has two overdue reminders.')],
    });
    const agent = createAgent({
      name: 'hb-e2e',
      instructions: 'work the checklist',
      provider,
      scaffold: 'minimal',
    });

    const outcomes: ProactiveOutcome[] = [];
    const heartbeat = createHeartbeat({
      agent,
      scheduler,
      schedule: { every: 60_000 },
      checklist: () => 'any reminders due?',
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      onOutcome: (o) => {
        outcomes.push(o);
      },
    });

    await heartbeat.start();
    await scheduler.start();
    await clock.advance(60_000);
    await waitFor(() => outcomes.length === 1);

    expect(outcomes[0]?.kind).toBe('notify');
    // Sentinel stripped, finding delivered.
    expect(outcomes[0]?.text).toBe('The morning digest has two overdue reminders.');
    expect(provider.scriptsConsumed()).toBe(1);
    expect(heartbeat.status().outcomes).toBe(1);

    await heartbeat.stop();
    await scheduler.stop();
  }, 20_000);
});
