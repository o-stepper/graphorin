import { createAgent } from '@graphorin/agent';
import type { ProactiveOutcome } from '@graphorin/core';
import type { SessionManager } from '@graphorin/sessions';
import { describe, expect, it, vi } from 'vitest';
import { createHeartbeat, type HeartbeatSkip } from '../src/index.js';
import {
  createMockProvider,
  createStubScheduler,
  FakeClock,
  textScript,
  waitFor,
} from './helpers.js';

const silentWarn = (): void => {};

function makeAgent(scripts: Parameters<typeof createMockProvider>[0]['scripts']) {
  const provider = createMockProvider({ modelId: 'mock-heartbeat', scripts });
  const agent = createAgent({ name: 'hb-agent', instructions: 'run the checklist', provider });
  return { provider, agent };
}

describe('createHeartbeat - validation', () => {
  it('requires exactly one of schedule.every / schedule.cron', () => {
    const { agent } = makeAgent([]);
    const scheduler = createStubScheduler();
    const base = { agent, scheduler, checklist: () => null };
    expect(() => createHeartbeat({ ...base, schedule: {} })).toThrow(/exactly one/);
    expect(() =>
      createHeartbeat({ ...base, schedule: { every: 60_000, cron: '* * * * *' } }),
    ).toThrow(/exactly one/);
    expect(() => createHeartbeat({ ...base, schedule: { every: 60_000 }, sentinel: '  ' })).toThrow(
      /sentinel/,
    );
    expect(() =>
      createHeartbeat({
        ...base,
        schedule: { every: 60_000 },
        activeHours: { from: '25:00', to: '07:00' },
      }),
    ).toThrow(/HH:MM/);
  });
});

describe('createHeartbeat - beat behaviour', () => {
  it('an empty checklist skips before any model call', async () => {
    const { provider, agent } = makeAgent([textScript('never')]);
    const scheduler = createStubScheduler();
    const skipsSeen: HeartbeatSkip[] = [];
    const heartbeat = createHeartbeat({
      agent,
      scheduler,
      schedule: { every: 60_000 },
      checklist: () => '   ',
      onSkip: (s) => skipsSeen.push(s),
      warn: silentWarn,
    });
    const result = await heartbeat.beat();
    expect(result.skipped).toBe('empty-checklist');
    expect(provider.scriptsConsumed()).toBe(0);
    expect(skipsSeen.map((s) => s.reason)).toEqual(['empty-checklist']);
    expect(heartbeat.status().beats).toBe(0);
  });

  it('a busy gate defers the beat and retries when the gate clears', async () => {
    const clock = new FakeClock();
    const { provider, agent } = makeAgent([textScript('Fridge is empty - buy milk.')]);
    const scheduler = createStubScheduler();
    let busy = true;
    const outcomes: ProactiveOutcome[] = [];
    const heartbeat = createHeartbeat({
      agent,
      scheduler,
      schedule: { every: 60_000 },
      checklist: () => 'check the fridge',
      runGate: () => busy,
      deferMs: 5_000,
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });

    const first = await heartbeat.beat();
    expect(first.skipped).toBe('agent-busy');
    expect(provider.scriptsConsumed()).toBe(0);
    expect(clock.pending().length).toBe(1); // the deferral retry is armed

    busy = false;
    await clock.advance(5_000);
    // The deferral timer kicked off a REAL agent run - poll for its
    // completion instead of counting microtask hops (wave-B lesson).
    await waitFor(() => outcomes.length === 1);
    expect(provider.scriptsConsumed()).toBe(1);
    expect(outcomes[0]?.kind).toBe('notify');
    expect(heartbeat.status().defers).toBe(1);
  });

  it('gives up (with a WARN) after maxDefers consecutive deferrals', async () => {
    const clock = new FakeClock();
    const warn = vi.fn();
    const { provider, agent } = makeAgent([]);
    const heartbeat = createHeartbeat({
      agent,
      scheduler: createStubScheduler(),
      schedule: { every: 60_000 },
      checklist: () => 'busy work',
      runGate: () => true,
      deferMs: 1_000,
      maxDefers: 2,
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      warn,
    });
    await heartbeat.beat(); // defer 1 armed
    await clock.advance(1_000); // defer 2 armed
    await clock.advance(1_000); // exceeds maxDefers -> drop
    expect(clock.pending().length).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('stayed busy'));
    expect(provider.scriptsConsumed()).toBe(0);
  });

  it('suppresses the sentinel reply and drops sub-threshold noise', async () => {
    const { agent } = makeAgent([
      textScript('HEARTBEAT_OK'),
      textScript('ok'),
      textScript('HEARTBEAT_OK\nThe backup job has been failing since 02:00.'),
    ]);
    const outcomes: ProactiveOutcome[] = [];
    const heartbeat = createHeartbeat({
      agent,
      scheduler: createStubScheduler(),
      schedule: { every: 60_000 },
      checklist: () => 'anything due?',
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });

    expect((await heartbeat.beat()).skipped).toBe('sentinel');
    expect((await heartbeat.beat()).skipped).toBe('below-min-length');
    const third = await heartbeat.beat();
    expect(third.outcome?.kind).toBe('notify');
    expect(third.outcome?.text).toBe('The backup job has been failing since 02:00.');
    expect(outcomes.length).toBe(1);
    const status = heartbeat.status();
    expect(status.skips.sentinel).toBe(1);
    expect(status.skips['below-min-length']).toBe(1);
    expect(status.outcomes).toBe(1);
  });

  it('isolated beats use fresh session ids; isolatedSession false reuses a stable one', async () => {
    const clock = new FakeClock();
    const { agent } = makeAgent([
      textScript('Reminder one is due today.'),
      textScript('Reminder two is due today.'),
    ]);
    const seen: string[] = [];
    const heartbeat = createHeartbeat({
      agent,
      scheduler: createStubScheduler(),
      schedule: { every: 60_000 },
      checklist: () => 'reminders',
      now: clock.now,
      onOutcome: (o) => {
        if (o.sessionId !== undefined) seen.push(o.sessionId);
      },
      warn: silentWarn,
    });
    await heartbeat.beat();
    await clock.advance(1);
    await heartbeat.beat();
    expect(seen.length).toBe(2);
    expect(seen[0]).not.toBe(seen[1]);

    const { agent: agent2 } = makeAgent([
      textScript('Reminder three is due today.'),
      textScript('Reminder four is due today.'),
    ]);
    const seen2: string[] = [];
    const stable = createHeartbeat({
      agent: agent2,
      scheduler: createStubScheduler(),
      schedule: { every: 60_000 },
      checklist: () => 'reminders',
      profile: { isolatedSession: false },
      onOutcome: (o) => {
        if (o.sessionId !== undefined) seen2.push(o.sessionId);
      },
      warn: silentWarn,
    });
    await stable.beat();
    await stable.beat();
    expect(seen2).toEqual(['heartbeat:heartbeat', 'heartbeat:heartbeat']);
  });

  it('creates a real session per isolated beat when a SessionManager is supplied', async () => {
    const { agent } = makeAgent([textScript('The plants need watering.')]);
    const created: Array<Record<string, unknown>> = [];
    const sessions = {
      create: async (args: Record<string, unknown>) => {
        created.push(args);
        return { id: 'sess-real-1' };
      },
    } as unknown as SessionManager;
    const outcomes: ProactiveOutcome[] = [];
    const heartbeat = createHeartbeat({
      agent,
      scheduler: createStubScheduler(),
      schedule: { every: 60_000 },
      checklist: () => 'plants',
      sessions,
      userId: 'owner-1',
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });
    await heartbeat.beat();
    expect(created.length).toBe(1);
    expect(created[0]?.userId).toBe('owner-1');
    expect(created[0]?.tags).toEqual(['heartbeat']);
    expect(outcomes[0]?.sessionId).toBe('sess-real-1');
  });

  it('skips outside active hours (window crossing midnight, UTC wall clock)', async () => {
    const clock = new FakeClock();
    const { provider, agent } = makeAgent([textScript('Something is due.')]);
    const heartbeat = createHeartbeat({
      agent,
      scheduler: createStubScheduler(),
      schedule: { every: 60_000 },
      checklist: () => 'due?',
      activeHours: { from: '22:00', to: '07:00', timezone: 'UTC' },
      now: clock.now,
      warn: silentWarn,
    });
    // FakeClock epoch 0 = 1970-01-01T00:00Z -> 00:00 wall = inside 22-07.
    const inside = await heartbeat.beat();
    expect(inside.outcome).toBeDefined();
    // Advance to 12:00Z - outside the window.
    await clock.advance(12 * 60 * 60 * 1000);
    const outside = await heartbeat.beat();
    expect(outside.skipped).toBe('inactive-hours');
    expect(provider.scriptsConsumed()).toBe(1);
  });

  it('budget-stops a beat through the C5 run budget (profile.budgetUsd)', async () => {
    const warn = vi.fn();
    // Step 1 costs $0.09 and asks for a tool the agent lacks... keep it
    // simpler: a single priced completion under a tiny token ceiling is
    // not possible (budget checks between steps). Use a two-step run:
    // the first step calls a registered noop tool, the second never
    // happens because the ceiling tripped.
    const { agent, provider } = (() => {
      const provider = createMockProvider({
        modelId: 'mock-priced',
        scripts: [
          {
            events: [
              { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
              { type: 'tool-call-start', toolCallId: 'tc-1', toolName: 'noop' },
              { type: 'tool-call-input-delta', toolCallId: 'tc-1', argsDelta: '{}' },
              { type: 'tool-call-end', toolCallId: 'tc-1', finalArgs: {} },
              {
                type: 'finish',
                finishReason: 'tool-calls',
                usage: {
                  promptTokens: 5,
                  completionTokens: 5,
                  totalTokens: 10,
                  cost: { amount: 0.09, currency: 'USD' },
                },
              },
            ],
          },
          textScript('never reached', 10, 0.09),
        ],
      });
      const noop = {
        name: 'noop',
        description: 'noop',
        inputSchema: {
          parse: (v: unknown) => v,
          safeParse: (v: unknown) => ({ success: true as const, data: v }),
          toJSON: () => ({ type: 'object' }),
        },
        sideEffectClass: 'read-only',
        execute: async () => 'ok',
      } as unknown as NonNullable<Parameters<typeof createAgent>[0]['tools']>[number];
      const agent = createAgent({
        name: 'hb-budget',
        instructions: 'work',
        provider,
        tools: [noop],
      });
      return { agent, provider };
    })();

    const heartbeat = createHeartbeat({
      agent,
      scheduler: createStubScheduler(),
      schedule: { every: 60_000 },
      checklist: () => 'expensive work',
      profile: { budgetUsd: 0.05 },
      warn,
    });
    const result = await heartbeat.beat();
    expect(result.runError?.code).toBe('budget-exceeded');
    expect(provider.scriptsConsumed()).toBe(1);
    expect(heartbeat.status().failures).toBe(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('budget-exceeded'));
  });

  it('pins the beat model through profile.provider (fail-closed)', async () => {
    const pinned = createMockProvider({
      modelId: 'pinned-cheap',
      scripts: [textScript('Pinned model says the queue is empty today.')],
    });
    const { provider: configured, agent } = makeAgent([textScript('from configured')]);
    const outcomes: ProactiveOutcome[] = [];
    const heartbeat = createHeartbeat({
      agent,
      scheduler: createStubScheduler(),
      schedule: { every: 60_000 },
      checklist: () => 'queue?',
      profile: { provider: pinned },
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });
    await heartbeat.beat();
    expect(pinned.scriptsConsumed()).toBe(1);
    expect(configured.scriptsConsumed()).toBe(0);
    expect(outcomes[0]?.text).toContain('Pinned model');
  });

  it('start() registers the schedule with C4 passthrough; stop() unregisters and cancels defers', async () => {
    const clock = new FakeClock();
    const scheduler = createStubScheduler();
    const { agent } = makeAgent([]);
    const heartbeat = createHeartbeat({
      agent,
      scheduler,
      schedule: { every: 60_000, jitterMs: 5_000, expiresAt: 999_999 },
      checklist: () => 'x',
      runGate: () => true,
      deferMs: 1_000,
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      warn: silentWarn,
    });
    await heartbeat.start();
    const decl = scheduler.declarations.get('heartbeat');
    expect(decl?.kind).toBe('interval');
    expect(decl?.options.jitterMs).toBe(5_000);
    expect(decl?.options.expiresAt).toBe(999_999);

    await heartbeat.beat(); // arms a defer
    expect(clock.pending().length).toBe(1);
    await heartbeat.stop();
    expect(clock.pending().length).toBe(0);
    expect(scheduler.declarations.size).toBe(0);
  });
});
