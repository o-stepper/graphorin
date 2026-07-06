/**
 * W-037 / W-055 (step 79): module-level unit tests for the run-loop seam
 * modules extracted in PR #152 - executed directly over minimal env
 * stubs, no full agent, no mock provider harness. These are the safety
 * net UNDER the e2e suites: a seam regression fails here with a precise
 * location instead of a distant transcript diff.
 */
import type {
  AgentEvent,
  Message,
  RunContext,
  RunState,
  ToolApproval,
  ToolCall,
  Usage,
  UsageAccumulator,
} from '@graphorin/core';
import { NOOP_TRACER } from '@graphorin/core';
import type { ToolExecutor } from '@graphorin/tools/executor';
import type { ToolRegistry } from '@graphorin/tools/registry';
import { describe, expect, it } from 'vitest';
import { createInitialRunState } from '../src/run-state/index.js';
import { processResumeDirective, safeParseGatedArgs } from '../src/runtime/approvals.js';
import {
  executeHandoffToolCall,
  type HandoffEntry,
  type HandoffRunEnv,
} from '../src/runtime/handoff.js';
import { emitCancellation, runVerifierGate } from '../src/runtime/run-gates.js';
import type { MutableRunState } from '../src/runtime/run-input.js';
import { processStepToolCalls, type ToolCallWalkEnv } from '../src/runtime/tool-call-walk.js';

type Ev = AgentEvent<string>;

async function drain<T, R>(gen: AsyncGenerator<T, R, void>): Promise<{ events: T[]; result: R }> {
  const events: T[] = [];
  while (true) {
    const next = await gen.next();
    if (next.done === true) return { events, result: next.value };
    events.push(next.value);
  }
}

function newState(): MutableRunState & RunState {
  const state = createInitialRunState({ id: 'run_1', agentId: 'parent', sessionId: 's1' });
  // The seams append completed calls onto the current step entry.
  (state.steps as unknown[]).push({
    stepNumber: 1,
    request: { messages: [] },
    toolCalls: [],
  });
  return state as MutableRunState & RunState;
}

function fakeUsageAcc(): UsageAccumulator & { readonly adds: Array<[string, Usage]> } {
  const adds: Array<[string, Usage]> = [];
  return {
    adds,
    total: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    byModel: new Map(),
    add(modelId: string, usage: Usage) {
      adds.push([modelId, usage]);
    },
    reset() {},
  } as unknown as UsageAccumulator & { readonly adds: Array<[string, Usage]> };
}

function approval(toolCallId: string, extra: Partial<ToolApproval> = {}): ToolApproval {
  return {
    toolCallId,
    toolName: 'danger_tool',
    args: { n: 1 },
    requestedAt: new Date(0).toISOString(),
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// run-gates: emitCancellation (W-038 policies)
// ---------------------------------------------------------------------------

describe('run-gates: emitCancellation', () => {
  function cancellationEnv(policy: 'deny' | 'hold' | 'fail', pending: ToolApproval[]) {
    const state = newState();
    state.pendingApprovals.push(...pending);
    const messages: Message[] = [];
    return {
      state,
      messages,
      env: {
        state,
        messages,
        getPendingAbort: () => ({ drain: false, onPendingApprovals: policy }),
      },
    };
  }

  it("'deny' drains every approval and commits a tool message per drained id", async () => {
    const { state, messages, env } = cancellationEnv('deny', [approval('c1'), approval('c2')]);
    const { events, result } = await drain(emitCancellation<string>(env));
    expect(result).toBe(false);
    expect(state.status).toBe('aborted');
    expect(state.pendingApprovals).toHaveLength(0);
    expect(events.map((e) => e.type)).toEqual([
      'agent.cancelling',
      'tool.approval.denied',
      'tool.approval.denied',
    ]);
    // The transcript must not keep dangling tool_use ids.
    expect(messages.map((m) => (m.role === 'tool' ? m.toolCallId : ''))).toEqual(['c1', 'c2']);
    expect(state.messages).toHaveLength(2);
  });

  it("'hold' keeps the queue on the aborted state", async () => {
    const { state, env } = cancellationEnv('hold', [approval('c1')]);
    const { events, result } = await drain(emitCancellation<string>(env));
    expect(result).toBe(false);
    expect(state.status).toBe('aborted');
    expect(state.pendingApprovals).toHaveLength(1);
    expect(events.map((e) => e.type)).toEqual(['agent.cancelling']);
  });

  it("'fail' fails the run ONLY when approvals are pending", async () => {
    const withPending = cancellationEnv('fail', [approval('c1')]);
    const failed = await drain(emitCancellation<string>(withPending.env));
    expect(failed.result).toBe(true);
    expect(withPending.state.status).toBe('failed');
    expect(withPending.state.error?.code).toBe('run-aborted');
    expect(failed.events.map((e) => e.type)).toEqual(['agent.cancelling', 'agent.error']);

    const empty = cancellationEnv('fail', []);
    const aborted = await drain(emitCancellation<string>(empty.env));
    expect(aborted.result).toBe(false);
    expect(empty.state.status).toBe('aborted');
  });
});

// ---------------------------------------------------------------------------
// run-gates: runVerifierGate (C3)
// ---------------------------------------------------------------------------

describe('run-gates: runVerifierGate', () => {
  function gateEnv(verifiers: ReadonlyArray<{ id: string; verify: (input: unknown) => unknown }>) {
    const state = newState();
    const messages: Message[] = [];
    return {
      state,
      messages,
      env: {
        config: { verifiers, maxVerifierRounds: 1 } as never,
        state,
        messages,
      },
    };
  }
  const snapshot = { output: 'final answer' } as never;

  it('a throwing verifier is treated as passed (never fails the run)', async () => {
    const { env, messages } = gateEnv([
      {
        id: 'buggy',
        verify: () => {
          throw new Error('verifier exploded');
        },
      },
    ]);
    const { events, result } = await drain(runVerifierGate<never, string>(env, snapshot, 3, 0));
    expect(result).toEqual({ continueRun: false, verifierRoundsUsed: 0 });
    expect(events).toEqual([
      { type: 'verifier.result', verifierId: 'buggy', ok: true, stepNumber: 3 },
    ]);
    expect(messages).toHaveLength(0);
  });

  it('a failing verifier feeds feedback back while rounds remain', async () => {
    const { env, state, messages } = gateEnv([
      { id: 'strict', verify: () => ({ ok: false, feedback: 'cite your sources' }) },
    ]);
    const { events, result } = await drain(runVerifierGate<never, string>(env, snapshot, 3, 0));
    expect(result).toEqual({ continueRun: true, verifierRoundsUsed: 1 });
    expect(events[0]).toMatchObject({
      type: 'verifier.result',
      ok: false,
      feedback: 'cite your sources',
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.role).toBe('user');
    expect(String(messages[0]?.content)).toContain('[verifier:strict] cite your sources');
    expect(state.messages).toHaveLength(1);
  });

  it('exhausted rounds complete with the last output (no feedback loop)', async () => {
    const { env, messages } = gateEnv([
      { id: 'strict', verify: () => ({ ok: false, feedback: 'still wrong' }) },
    ]);
    const { result } = await drain(runVerifierGate<never, string>(env, snapshot, 4, 1));
    expect(result).toEqual({ continueRun: false, verifierRoundsUsed: 1 });
    expect(messages).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// approvals: safeParseGatedArgs + processResumeDirective
// ---------------------------------------------------------------------------

describe('approvals: safeParseGatedArgs', () => {
  it('returns undefined when the tool exposes no callable safeParse', () => {
    expect(safeParseGatedArgs({}, { a: 1 })).toBeUndefined();
    expect(safeParseGatedArgs({ inputSchema: {} }, { a: 1 })).toBeUndefined();
  });

  it('propagates a successful parse with the coerced data', () => {
    const tool = {
      inputSchema: { safeParse: (v: unknown) => ({ success: true, data: { parsed: v } }) },
    };
    expect(safeParseGatedArgs(tool, 7)).toEqual({ success: true, data: { parsed: 7 } });
  });

  it('a throwing schema counts as a validation failure, not a crash', () => {
    const tool = {
      inputSchema: {
        safeParse: () => {
          throw new Error('schema exploded');
        },
      },
    };
    expect(safeParseGatedArgs(tool, {})).toEqual({ success: false, message: 'schema exploded' });
  });
});

describe('approvals: processResumeDirective', () => {
  it('grant queues for real execution, deny writes the tool error, absent stays pending', async () => {
    const state = newState();
    state.status = 'awaiting_approval' as RunState['status'];
    state.pendingApprovals.push(approval('g1'), approval('d1'), approval('p1'));
    const messages: Message[] = [];
    const resumed: ToolCall[] = [];
    const granted: ToolApproval[] = [];
    const { events } = await drain(
      processResumeDirective<string>(
        { state, messages },
        [
          { toolCallId: 'g1', granted: true },
          { toolCallId: 'd1', granted: false, reason: 'too risky' },
        ],
        resumed,
        granted,
      ),
    );
    expect(events.map((e) => e.type)).toEqual(['tool.approval.granted', 'tool.approval.denied']);
    expect(resumed).toEqual([{ toolCallId: 'g1', toolName: 'danger_tool', args: { n: 1 } }]);
    expect(granted.map((g) => g.toolCallId)).toEqual(['g1']);
    // Denied id got a tool message; the transcript stays provider-valid.
    expect(messages).toEqual([
      { role: 'tool', toolCallId: 'd1', content: 'Error: tool approval denied: too risky' },
    ]);
    // p1 had no decision: still pending, so the run must NOT flip to running.
    expect(state.pendingApprovals.map((a) => a.toolCallId)).toEqual(['p1']);
    expect(state.status).toBe('awaiting_approval');
  });

  it('flips the status back to running once the queue fully drains', async () => {
    const state = newState();
    state.status = 'awaiting_approval' as RunState['status'];
    state.pendingApprovals.push(approval('g1'));
    const { events } = await drain(
      processResumeDirective<string>(
        { state, messages: [] },
        [{ toolCallId: 'g1', granted: true }],
        [],
        [],
      ),
    );
    expect(events).toHaveLength(1);
    expect(state.pendingApprovals).toHaveLength(0);
    expect(state.status).toBe('running');
  });

  it('replays a journaled call whose result survived instead of re-executing it', async () => {
    const state = newState();
    state.pendingApprovals.push(approval('done1'));
    const stepEntry = state.steps[0] as unknown as { toolCalls: unknown[] };
    stepEntry.toolCalls.push({
      call: { toolCallId: 'done1', toolName: 'danger_tool', args: { n: 1 } },
      outcome: { toolCallId: 'done1', toolName: 'danger_tool', output: 'ok', durationMs: 1 },
      stepNumber: 1,
    });
    const messages: Message[] = [{ role: 'tool', toolCallId: 'done1', content: 'ok' }];
    const resumed: ToolCall[] = [];
    await drain(
      processResumeDirective<string>(
        { state, messages },
        [{ toolCallId: 'done1', granted: true }],
        resumed,
        [],
      ),
    );
    // Exactly-once: journaled + result present => replay, never re-dispatch.
    expect(resumed).toHaveLength(0);
    expect(state.pendingApprovals).toHaveLength(0);
    expect(state.status).toBe('running');
  });

  it('routes a parked sub-run decision one path segment down (W-001)', async () => {
    const state = newState();
    state.pendingApprovals.push(approval('childCall', { subRunToolCallId: 'park1/grand2' }));
    const routed = new Map<string, Array<{ toolCallId: string; subRunToolCallId?: string }>>();
    const resumed: ToolCall[] = [];
    const { events } = await drain(
      processResumeDirective<string>(
        { state, messages: [] },
        [{ toolCallId: 'childCall', granted: true, subRunToolCallId: 'park1/grand2' }],
        resumed,
        [],
        routed as never,
      ),
    );
    expect(events.map((e) => e.type)).toEqual(['tool.approval.granted']);
    // Resolves on the parent (leaves the queue) but EXECUTES in the child.
    expect(resumed).toHaveLength(0);
    expect([...routed.keys()]).toEqual(['park1']);
    expect(routed.get('park1')).toEqual([
      { toolCallId: 'childCall', granted: true, subRunToolCallId: 'grand2' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// handoff: executeHandoffToolCall over a stub child agent
// ---------------------------------------------------------------------------

describe('handoff: executeHandoffToolCall', () => {
  function childEvents(result: {
    status: 'completed' | 'failed' | 'aborted' | 'awaiting_approval';
    state: RunState;
    error?: { message: string };
  }): Ev[] {
    return [
      { type: 'text.complete', text: 'child says hi' } as Ev,
      { type: 'agent.end', result: { ...result, output: 'child says hi' } } as unknown as Ev,
    ];
  }

  function handoffFixture(events: ReadonlyArray<Ev>) {
    const state = newState();
    const messages: Message[] = [{ role: 'user', content: 'go' }];
    const usageAcc = fakeUsageAcc();
    const streamedWith: unknown[] = [];
    const agent = {
      id: 'child-agent',
      config: { name: 'child' },
      stream(seed: unknown, opts: unknown) {
        streamedWith.push({ seed, opts });
        return (async function* () {
          yield* events;
        })();
      },
    };
    const env: HandoffRunEnv<undefined, string> = {
      config: {},
      options: {},
      state,
      messages,
      sessionId: 's1',
      agentId: 'parent',
      signal: new AbortController().signal,
      usageAcc,
    };
    const entry = { agent, filter: undefined } as unknown as HandoffEntry<undefined>;
    return { state, messages, usageAcc, env, entry, streamedWith };
  }
  const call: ToolCall = { toolCallId: 'h1', toolName: 'transfer_to_child', args: {} };

  it('a completed child surfaces as tool.execute.end and restores currentAgentId', async () => {
    const childState = createInitialRunState({ id: 'run_c', agentId: 'child', sessionId: 's1' });
    (childState.usage as { totalTokens: number }).totalTokens = 42;
    (childState.usage as { promptTokens: number }).promptTokens = 40;
    (childState.usage as { completionTokens: number }).completionTokens = 2;
    const fx = handoffFixture(childEvents({ status: 'completed', state: childState }));
    const { events, result } = await drain(
      executeHandoffToolCall<undefined, string>(fx.env, call, fx.entry, 1),
    );
    expect(result).toEqual({ suspendRequested: false });
    expect(events.map((e) => e.type)).toEqual([
      'tool.execute.start',
      'handoff',
      'tool.execute.end',
    ]);
    const end = events[2] as Extract<Ev, { type: 'tool.execute.end' }>;
    expect(end.result).toBe('child says hi');
    // W-049: handoff-path tool.execute.* events carry toolName too.
    expect(end.toolName).toBe('transfer_to_child');
    expect((events[0] as Extract<Ev, { type: 'tool.execute.start' }>).toolName).toBe(
      'transfer_to_child',
    );
    // W-034: the transfer is scoped to the child observation.
    expect(fx.state.currentAgentId).toBe('parent');
    expect(fx.state.handoffs).toHaveLength(1);
    expect(fx.state.handoffs[0]).toMatchObject({ fromAgentId: 'parent', toAgentId: 'child-agent' });
    // W-033: terminal child usage folded exactly once.
    expect(fx.usageAcc.adds).toEqual([['sub-agent:child', childState.usage]]);
    expect(fx.state.usage.totalTokens).toBe(42);
    // The tool message committed to BOTH buffers.
    expect(fx.messages.at(-1)).toEqual({
      role: 'tool',
      toolCallId: 'h1',
      content: 'child says hi',
    });
    expect(fx.state.messages.at(-1)).toMatchObject({ role: 'tool', toolCallId: 'h1' });
  });

  it('a failed child surfaces as a typed tool error (never an empty success)', async () => {
    const childState = createInitialRunState({ id: 'run_c', agentId: 'child', sessionId: 's1' });
    const fx = handoffFixture(
      childEvents({ status: 'failed', state: childState, error: { message: 'boom' } }),
    );
    const { events, result } = await drain(
      executeHandoffToolCall<undefined, string>(fx.env, call, fx.entry, 1),
    );
    expect(result).toEqual({ suspendRequested: false });
    const error = events.find((e) => e.type === 'tool.execute.error') as Extract<
      Ev,
      { type: 'tool.execute.error' }
    >;
    expect(error.error.kind).toBe('execution_failed');
    expect(error.error.message).toContain("handoff to 'child-agent' failed: boom");
    expect(error.toolName).toBe('transfer_to_child');
    expect(fx.state.currentAgentId).toBe('parent');
    expect(fx.messages.at(-1)?.role).toBe('tool');
  });

  it('an aborted child maps to the aborted tool-error kind', async () => {
    const childState = createInitialRunState({ id: 'run_c', agentId: 'child', sessionId: 's1' });
    const fx = handoffFixture(childEvents({ status: 'aborted', state: childState }));
    const { events } = await drain(
      executeHandoffToolCall<undefined, string>(fx.env, call, fx.entry, 1),
    );
    const error = events.find((e) => e.type === 'tool.execute.error') as Extract<
      Ev,
      { type: 'tool.execute.error' }
    >;
    expect(error.error.kind).toBe('aborted');
  });

  it('an awaiting_approval child parks on the parent and mirrors its approvals (W-001)', async () => {
    const childState = createInitialRunState({ id: 'run_c', agentId: 'child', sessionId: 's1' });
    childState.pendingApprovals.push(approval('childCall1'));
    const fx = handoffFixture(childEvents({ status: 'awaiting_approval', state: childState }));
    const { events, result } = await drain(
      executeHandoffToolCall<undefined, string>(fx.env, call, fx.entry, 1),
    );
    expect(result).toEqual({ suspendRequested: true });
    expect(events.map((e) => e.type)).toEqual([
      'tool.execute.start',
      'handoff',
      'tool.approval.requested',
    ]);
    expect(fx.state.pendingSubRuns).toHaveLength(1);
    expect(fx.state.pendingSubRuns?.[0]).toMatchObject({
      toolCallId: 'h1',
      targetAgentName: 'child',
    });
    expect(fx.state.pendingApprovals).toHaveLength(1);
    // The mirrored approval carries the routing path (parent park key).
    expect(fx.state.pendingApprovals[0]).toMatchObject({
      toolCallId: 'childCall1',
      subRunToolCallId: 'h1',
    });
    // A parked call keeps NO tool message - exactly like a gated call.
    expect(fx.messages.some((m) => m.role === 'tool')).toBe(false);
    // No usage fold at a park (would double-count on resume).
    expect(fx.usageAcc.adds).toHaveLength(0);
    expect(fx.state.currentAgentId).toBe('parent');
  });
});

// ---------------------------------------------------------------------------
// tool-call-walk: batch flush ordering
// ---------------------------------------------------------------------------

describe('tool-call-walk: processStepToolCalls', () => {
  function walkFixture(opts: { gatedTools?: ReadonlyArray<string> } = {}) {
    const state = newState();
    const messages: Message[] = [];
    const order: Array<string> = [];
    const dispatched: string[][] = [];
    const gated = new Set(opts.gatedTools ?? []);
    const childState = createInitialRunState({ id: 'run_c', agentId: 'child', sessionId: 's1' });
    const agent = {
      id: 'child-agent',
      config: { name: 'child' },
      stream() {
        order.push('handoff');
        return (async function* () {
          yield {
            type: 'agent.end',
            result: { status: 'completed', output: 'ok', state: childState },
          } as unknown as AgentEvent<unknown>;
        })();
      },
    };
    const env = {
      config: {},
      options: {},
      state,
      messages,
      sessionId: 's1',
      agentId: 'parent',
      signal: new AbortController().signal,
      usageAcc: fakeUsageAcc(),
      handoffMap: new Map([
        ['transfer_to_child', { agent, filter: undefined } as unknown as HandoffEntry<undefined>],
      ]),
      toolDataFlowGuard: undefined,
      promotedDeferred: new Set<string>(),
      dispatchBatch: async function* (calls: ReadonlyArray<ToolCall>) {
        order.push(`batch:${calls.map((c) => c.toolCallId).join(',')}`);
        dispatched.push(calls.map((c) => c.toolCallId));
      },
    } as unknown as ToolCallWalkEnv<undefined, string>;
    const registry = {
      get: (name: string) => (gated.has(name) ? { name, needsApproval: true } : { name }),
    } as unknown as ToolRegistry;
    const runContext = { tracer: NOOP_TRACER } as unknown as RunContext<undefined>;
    return { state, messages, order, dispatched, env, registry, runContext };
  }
  const mkCall = (id: string, tool: string): ToolCall => ({
    toolCallId: id,
    toolName: tool,
    args: {},
  });

  it('flushes the queued batch BEFORE a handoff, then batches the remainder', async () => {
    const fx = walkFixture();
    const { result } = await drain(
      processStepToolCalls<undefined, string>(
        fx.env,
        [
          mkCall('a', 'lookup'),
          mkCall('b', 'lookup'),
          mkCall('h', 'transfer_to_child'),
          mkCall('c', 'lookup'),
        ],
        fx.registry,
        {} as ToolExecutor,
        fx.runContext,
        1,
      ),
    );
    expect(result).toEqual({ suspended: false });
    // Prior side effects complete first; later calls run after the handoff.
    expect(fx.order).toEqual(['batch:a,b', 'handoff', 'batch:c']);
  });

  it('flushes the queued batch BEFORE a gated call and still executes later calls (agent-01)', async () => {
    const fx = walkFixture({ gatedTools: ['danger_tool'] });
    const { events, result } = await drain(
      processStepToolCalls<undefined, string>(
        fx.env,
        [mkCall('a', 'lookup'), mkCall('g', 'danger_tool'), mkCall('c', 'lookup')],
        fx.registry,
        {} as ToolExecutor,
        fx.runContext,
        1,
      ),
    );
    // The batch before the gate flushed first; the post-gate call still ran.
    expect(fx.order).toEqual(['batch:a', 'batch:c']);
    expect(events.map((e) => e.type)).toContain('tool.approval.requested');
    expect(result).toEqual({ suspended: true });
    expect(fx.state.status).toBe('awaiting_approval');
    expect(fx.state.pendingApprovals.map((a) => a.toolCallId)).toEqual(['g']);
  });

  it('fails a gated call fast on schema-invalid args instead of asking a human (tools-02)', async () => {
    const fx = walkFixture();
    const registry = {
      get: () => ({
        name: 'danger_tool',
        needsApproval: true,
        inputSchema: {
          safeParse: () => ({ success: false, error: { message: 'n must be a number' } }),
        },
      }),
    } as unknown as ToolRegistry;
    const { events, result } = await drain(
      processStepToolCalls<undefined, string>(
        fx.env,
        [mkCall('bad', 'danger_tool')],
        registry,
        {} as ToolExecutor,
        fx.runContext,
        1,
      ),
    );
    expect(result).toEqual({ suspended: false });
    const error = events.find((e) => e.type === 'tool.execute.error') as Extract<
      Ev,
      { type: 'tool.execute.error' }
    >;
    expect(error.error.kind).toBe('invalid_input');
    expect(error.toolName).toBe('danger_tool');
    expect(fx.state.pendingApprovals).toHaveLength(0);
    expect(fx.messages.at(-1)?.role).toBe('tool');
  });
});

// ---------------------------------------------------------------------------
// W-049: toolName rides every tool.execute.* event end-to-end
// ---------------------------------------------------------------------------

describe('W-049: toolName on tool.execute.* events', () => {
  it('ordinary and error dispatch paths carry toolName without a stateful join', async () => {
    const { createAgent } = await import('../src/index.js');
    const { createMockProvider, toolCallScript, textOnlyScript } = await import(
      './fixtures/mock-provider.js'
    );
    const mkTool = (name: string, execute: () => Promise<string>) =>
      ({
        name,
        description: 'w049 fixture',
        inputSchema: {
          parse: (v: unknown) => v,
          safeParse: (v: unknown) => ({ success: true as const, data: v }),
          toJSON: () => ({ type: 'object' }),
        },
        execute,
      }) as never;
    const agent = createAgent({
      name: 'w049',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({ toolCallId: 'c1', toolName: 'ok_tool', args: {} }),
          toolCallScript({ toolCallId: 'c2', toolName: 'bad_tool', args: {} }),
          textOnlyScript('done', 4),
        ],
      }),
      tools: [
        mkTool('ok_tool', async () => 'fine'),
        mkTool('bad_tool', async () => {
          throw new Error('nope');
        }),
      ],
    });
    const events: AgentEvent<string>[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);

    const start = events.find(
      (e) => e.type === 'tool.execute.start' && e.toolCallId === 'c1',
    ) as Extract<Ev, { type: 'tool.execute.start' }>;
    const end = events.find((e) => e.type === 'tool.execute.end') as Extract<
      Ev,
      { type: 'tool.execute.end' }
    >;
    const error = events.find((e) => e.type === 'tool.execute.error') as Extract<
      Ev,
      { type: 'tool.execute.error' }
    >;
    expect(start.toolName).toBe('ok_tool');
    expect(end.toolName).toBe('ok_tool');
    expect(error.toolName).toBe('bad_tool');
    // The duplicated name agrees with the model-side tool.call.start.
    const callStart = events.find(
      (e) => e.type === 'tool.call.start' && e.toolCallId === 'c1',
    ) as Extract<Ev, { type: 'tool.call.start' }>;
    expect(callStart.toolName).toBe(start.toolName);
  });
});
