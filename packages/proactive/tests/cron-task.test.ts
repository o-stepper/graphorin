import { createAgent } from '@graphorin/agent';
import type { ProactiveOutcome, Tool } from '@graphorin/core';
import { describe, expect, it, vi } from 'vitest';
import { createProactiveCronTask, parseApprovalRef, serializeApprovalRef } from '../src/index.js';
import { createMockProvider, createStubScheduler, textScript, toolCallScript } from './helpers.js';

const silentWarn = (): void => {};

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function makeTool(
  name: string,
  extra: Partial<Tool<unknown, unknown, unknown>> = {},
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'read-only',
    execute: async () => 'ok',
    ...extra,
  } as Tool<unknown, unknown, unknown>;
}

describe('approval refs', () => {
  it('roundtrips and rejects junk without throwing', () => {
    const ref = serializeApprovalRef({ runId: 'run_abc:1', toolCallId: 'tc-9' });
    expect(ref.startsWith('run:')).toBe(true);
    expect(parseApprovalRef(ref)).toEqual({ runId: 'run_abc:1', toolCallId: 'tc-9' });
    expect(parseApprovalRef('wf:a:b:c')).toBeNull();
    expect(parseApprovalRef('run:only-two')).toBeNull();
    expect(parseApprovalRef('garbage')).toBeNull();
    expect(parseApprovalRef('run::%')).toBeNull();
    expect(() => serializeApprovalRef({ runId: '', toolCallId: 'x' })).toThrow(/non-empty/);
  });
});

describe('createProactiveCronTask - fail-closed config checks', () => {
  const scheduler = createStubScheduler();

  function baseOptions() {
    const provider = createMockProvider({ modelId: 'task-model', scripts: [] });
    const agent = createAgent({ name: 'task-agent', instructions: 'x', provider });
    return {
      id: 'nightly',
      agent,
      scheduler,
      schedule: { cron: '0 3 * * *' },
      prompt: 'do the nightly sweep',
      provider,
    };
  }

  it('requires the pinned provider', () => {
    const opts = baseOptions();
    expect(() => createProactiveCronTask({ ...opts, provider: undefined as never })).toThrowError(
      expect.objectContaining({ name: 'ProactiveConfigError', rule: 'invalid-options' }),
    );
  });

  it("grant 'act' without ingest-gate evidence is rejected; with evidence it passes", () => {
    const opts = baseOptions();
    expect(() => createProactiveCronTask({ ...opts, grant: 'act' })).toThrowError(
      expect.objectContaining({ name: 'ProactiveConfigError', rule: 'act-requires-ingest-gate' }),
    );
    expect(() =>
      createProactiveCronTask({ ...opts, grant: 'act', memory: { ingestGate: null } }),
    ).toThrowError(expect.objectContaining({ rule: 'act-requires-ingest-gate' }));
    expect(() =>
      createProactiveCronTask({
        ...opts,
        grant: 'act',
        memory: { ingestGate: () => true },
      }),
    ).not.toThrow();
  });

  it('a reachable scheduling tool is rejected unless explicitly granted', () => {
    const provider = createMockProvider({ modelId: 'task-model', scripts: [] });
    const agent = createAgent({
      name: 'task-agent-sched',
      instructions: 'x',
      provider,
      tools: [makeTool('schedule_trigger')],
    });
    const opts = {
      id: 'sched-guard',
      agent,
      scheduler,
      schedule: { cron: '0 3 * * *' },
      prompt: 'work',
      provider,
      schedulingToolNames: ['schedule_trigger'],
    };
    expect(() => createProactiveCronTask(opts)).toThrowError(
      expect.objectContaining({ name: 'ProactiveConfigError', rule: 'recursive-scheduling' }),
    );
    expect(() =>
      createProactiveCronTask({ ...opts, allowRecursiveScheduling: true }),
    ).not.toThrow();
  });
});

describe('createProactiveCronTask - fires', () => {
  it('pins the model fail-closed: the task provider serves the fire, config provider and fallbacks stay cold', async () => {
    const configured = createMockProvider({
      modelId: 'configured',
      scripts: [textScript('from configured')],
    });
    const fallback = createMockProvider({
      modelId: 'fallback',
      scripts: [textScript('from fallback')],
    });
    const pinned = createMockProvider({
      modelId: 'pinned-cheap',
      scripts: [textScript('The nightly sweep found two stale drafts.')],
    });
    const agent = createAgent({
      name: 'pinned-task',
      instructions: 'x',
      provider: configured,
      fallbackModels: [fallback],
    });
    const outcomes: ProactiveOutcome[] = [];
    const task = createProactiveCronTask({
      id: 'nightly-pin',
      agent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 3 * * *' },
      prompt: 'sweep',
      provider: pinned,
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });
    const result = await task.fire();
    expect(result.outcome?.kind).toBe('notify');
    expect(pinned.scriptsConsumed()).toBe(1);
    expect(configured.scriptsConsumed()).toBe(0);
    expect(fallback.scriptsConsumed()).toBe(0);
    expect(outcomes[0]?.text).toContain('stale drafts');
  });

  it('creates a fresh session per fire', async () => {
    let tick = 0;
    const provider = createMockProvider({
      modelId: 'fresh',
      scripts: [textScript('Fire one report ready.'), textScript('Fire two report ready.')],
    });
    const agent = createAgent({ name: 'fresh-task', instructions: 'x', provider });
    const seen: string[] = [];
    const task = createProactiveCronTask({
      id: 'fresh',
      agent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 * * * *' },
      prompt: 'report',
      provider,
      now: () => ++tick,
      onOutcome: (o) => {
        if (o.sessionId !== undefined) seen.push(o.sessionId);
      },
      warn: silentWarn,
    });
    await task.fire();
    await task.fire();
    expect(seen.length).toBe(2);
    expect(seen[0]).not.toBe(seen[1]);
    expect(seen[0]).toContain('proactive:fresh-');
  });

  it("grant 'notify' cannot act: a fabricated writer call is blocked by the read-only capability", async () => {
    const writerExecute = vi.fn(async () => 'wrote!');
    const writer = makeTool('send_email', {
      sideEffectClass: 'side-effecting',
      execute: writerExecute,
    });
    const provider = createMockProvider({
      modelId: 'act-attempt',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'send_email', args: { to: 'x' } }),
        textScript('Could not send; reporting the draft instead for your review.'),
      ],
    });
    const agent = createAgent({
      name: 'notify-only',
      instructions: 'x',
      provider,
      tools: [writer],
    });
    const outcomes: ProactiveOutcome[] = [];
    const task = createProactiveCronTask({
      id: 'no-act',
      agent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 3 * * *' },
      prompt: 'send the digest',
      provider,
      grant: 'notify',
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });
    const result = await task.fire();
    // The writer NEVER executed - blocked deterministically by the D2
    // read-only capability the 'notify' grant maps onto.
    expect(writerExecute).not.toHaveBeenCalled();
    expect(result.outcome?.kind).toBe('notify');
    expect(outcomes.length).toBe(1);
  });

  it("grant 'review': a parked writer approval becomes a review outcome with a resolvable ref", async () => {
    const gatedExecute = vi.fn(async () => 'sent');
    const gated = makeTool('send_email', {
      sideEffectClass: 'side-effecting',
      needsApproval: true,
      execute: gatedExecute,
    });
    const provider = createMockProvider({
      modelId: 'review-model',
      scripts: [
        toolCallScript({ toolCallId: 'tc-mail', toolName: 'send_email', args: { to: 'x' } }),
      ],
    });
    const agent = createAgent({
      name: 'review-task',
      instructions: 'x',
      provider,
      tools: [gated],
    });
    const outcomes: ProactiveOutcome[] = [];
    const task = createProactiveCronTask({
      id: 'review-flow',
      agent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 3 * * *' },
      prompt: 'send the weekly mail',
      provider,
      grant: 'review',
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });
    const result = await task.fire();
    expect(result.outcome?.kind).toBe('review');
    expect(gatedExecute).not.toHaveBeenCalled(); // parked, not executed
    const outcome = outcomes[0];
    expect(outcome?.kind).toBe('review');
    if (outcome?.kind === 'review') {
      const parsed = parseApprovalRef(outcome.ref);
      expect(parsed?.toolCallId).toBe('tc-mail');
      expect(parsed?.runId).toBe(outcome.runId);
      expect(outcome.options?.map((o) => o.value)).toEqual(['approve', 'deny']);
    }
    expect(task.status().outcomes).toBe(1);
  });

  it('an escalation above the grant is auto-denied fail-closed', async () => {
    const gatedExecute = vi.fn(async () => 'looked');
    // A read-only gated tool parks as a 'question' - above 'notify'.
    const gated = makeTool('ask_owner', { needsApproval: true, execute: gatedExecute });
    const warn = vi.fn();
    const provider = createMockProvider({
      modelId: 'escalation-model',
      scripts: [
        toolCallScript({ toolCallId: 'tc-ask', toolName: 'ask_owner', args: {} }),
        textScript('Understood, standing down.'), // after the auto-denial resume
      ],
    });
    const agent = createAgent({
      name: 'escalation-task',
      instructions: 'x',
      provider,
      tools: [gated],
    });
    const outcomes: ProactiveOutcome[] = [];
    const task = createProactiveCronTask({
      id: 'escalation',
      agent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 3 * * *' },
      prompt: 'poke the owner',
      provider,
      grant: 'notify',
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn,
    });
    const result = await task.fire();
    expect(result.escalationBlocked).toBe('question');
    expect(result.outcome).toBeUndefined();
    expect(outcomes.length).toBe(0);
    expect(gatedExecute).not.toHaveBeenCalled();
    // The denial resume consumed the second script - no parked state left.
    expect(provider.scriptsConsumed()).toBe(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("above its grant 'notify'"));
    expect(task.status().escalationsBlocked).toBe(1);
  });

  it("grant 'act' with gate evidence: an executed writer marks the outcome 'act'", async () => {
    const writer = makeTool('rotate_backup', {
      sideEffectClass: 'side-effecting',
      execute: async () => 'rotated',
    });
    const provider = createMockProvider({
      modelId: 'act-model',
      scripts: [
        toolCallScript({ toolCallId: 'tc-rot', toolName: 'rotate_backup', args: {} }),
        textScript('Rotated the stale backup set and pruned two snapshots.'),
      ],
    });
    const agent = createAgent({ name: 'act-task', instructions: 'x', provider, tools: [writer] });
    const outcomes: ProactiveOutcome[] = [];
    const task = createProactiveCronTask({
      id: 'act-flow',
      agent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 4 * * *' },
      prompt: 'rotate backups',
      provider,
      grant: 'act',
      memory: { ingestGate: () => true },
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });
    const result = await task.fire();
    expect(result.outcome?.kind).toBe('act');
    expect(outcomes[0]?.kind).toBe('act');
  });

  it('start() registers the cron declaration with C4 passthrough; stop() unregisters', async () => {
    const scheduler = createStubScheduler();
    const provider = createMockProvider({ modelId: 'reg', scripts: [] });
    const agent = createAgent({ name: 'reg-task', instructions: 'x', provider });
    const task = createProactiveCronTask({
      id: 'registered',
      agent,
      scheduler,
      schedule: { cron: '0 3 * * *', timezone: 'Europe/Kyiv', jitterMs: 30_000 },
      prompt: 'x',
      provider,
      warn: silentWarn,
    });
    await task.start();
    const decl = scheduler.declarations.get('registered');
    expect(decl?.kind).toBe('cron');
    expect(decl?.options.timezone).toBe('Europe/Kyiv');
    expect(decl?.options.jitterMs).toBe(30_000);
    await task.stop();
    expect(scheduler.declarations.size).toBe(0);
  });
});

describe('createProactiveCronTask - scheduler wiring + fire error path (coverage leg)', () => {
  it('start() registers the cron declaration and the trigger callback drives a real fire', async () => {
    const provider = createMockProvider({
      modelId: 'task-model',
      scripts: [textScript('Sweep done - nothing stale.')],
    });
    const agent = createAgent({ name: 'wired-task', instructions: 'x', provider });
    const scheduler = createStubScheduler();
    const outcomes: ProactiveOutcome[] = [];
    const task = createProactiveCronTask({
      id: 'nightly-wired',
      agent,
      scheduler,
      schedule: { cron: '0 3 * * *' },
      prompt: 'sweep',
      provider,
      onOutcome: (o) => {
        outcomes.push(o);
      },
      warn: silentWarn,
    });
    await task.start();
    const declaration = scheduler.declarations.get('nightly-wired');
    expect(declaration?.kind).toBe('cron');
    declaration?.callback();
    await vi.waitFor(() => {
      expect(outcomes.length).toBe(1);
    });
    expect(provider.scriptsConsumed()).toBe(1);
  });

  it('a throwing onOutcome observer is warned by the deliver guard; the outcome still lands', async () => {
    const provider = createMockProvider({
      modelId: 'task-model',
      scripts: [textScript('Report ready.')],
    });
    const agent = createAgent({ name: 'exploding-sink', instructions: 'x', provider });
    const warn = vi.fn();
    const task = createProactiveCronTask({
      id: 'nightly-exploding',
      agent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 3 * * *' },
      prompt: 'sweep',
      provider,
      onOutcome: () => {
        throw new Error('sink exploded');
      },
      warn,
    });
    const result = await task.fire();
    expect(result.outcome?.kind).toBe('notify');
    expect(result.runError).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('onOutcome observer threw'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sink exploded'));
  });

  it('an agent that rejects mid-fire lands in the fire catch: runError + warn', async () => {
    const provider = createMockProvider({ modelId: 'task-model', scripts: [] });
    const agent = createAgent({ name: 'rejecting-task', instructions: 'x', provider });
    // A run() rejection (not a failed result) is the catch's territory -
    // simulate the pinned-provider agent throwing synchronously.
    const throwingAgent = Object.create(agent) as typeof agent;
    throwingAgent.run = () => Promise.reject(new Error('provider melted'));
    const warn = vi.fn();
    const task = createProactiveCronTask({
      id: 'nightly-melting',
      agent: throwingAgent,
      scheduler: createStubScheduler(),
      schedule: { cron: '0 3 * * *' },
      prompt: 'sweep',
      provider,
      warn,
    });
    const result = await task.fire();
    expect(result.outcome).toBeUndefined();
    expect(result.runError?.code).toBe('fire-threw');
    expect(result.runError?.message).toContain('provider melted');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('fire threw'));
    expect(task.status().failures).toBe(1);
  });
});
