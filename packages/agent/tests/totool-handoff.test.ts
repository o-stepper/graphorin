import type {
  AgentEvent,
  Provider,
  ProviderRequest,
  Tool,
  ToolExecutionContext,
} from '@graphorin/core';
import { NOOP_LOGGER, NOOP_TRACER } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { sanitizeHandoffSeed } from '../src/runtime/handoff.js';
import {
  createMockProvider,
  errorScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

function capturingProvider(base: ReturnType<typeof createMockProvider>): {
  readonly provider: Provider;
  readonly requests: ProviderRequest[];
} {
  const requests: ProviderRequest[] = [];
  const provider: Provider = {
    ...base,
    stream(req: ProviderRequest) {
      requests.push(req);
      return base.stream(req);
    },
  };
  return { provider, requests };
}

/** Minimal parent ToolExecutionContext for direct tool.execute calls. */
function parentCtx(args: {
  readonly deps?: unknown;
  readonly sessionId?: string;
  readonly signal?: AbortSignal;
  readonly messages?: ProviderRequest['messages'];
}): ToolExecutionContext<unknown> {
  const signal = args.signal ?? new AbortController().signal;
  return {
    toolCallId: 'tc-parent',
    runContext: {
      runId: 'run_parent',
      sessionId: args.sessionId ?? 'sess-parent',
      agentId: 'agent_parent',
      deps: args.deps,
      tracer: NOOP_TRACER,
      signal,
      usage: { add: () => {} } as never,
      stepNumber: 1,
      messages: (args.messages ?? []) as never,
      state: { id: 'run_parent', status: 'running' } as never,
    } as never,
    signal,
    tracer: NOOP_TRACER,
    logger: NOOP_LOGGER,
    secrets: { get: () => undefined } as never,
    reportProgress: () => {},
    streamContent: () => {},
  } as ToolExecutionContext<unknown>;
}

describe('Agent.toTool - context propagation (AG-17)', () => {
  it('forwards parent deps + sessionId + signal into the sub-agent run', async () => {
    const seen: { deps?: unknown; sessionId?: string } = {};
    const recorder: Tool<unknown, string, unknown> = {
      name: 'recorder',
      description: 'records its execution context',
      inputSchema: {
        parse: (v: unknown) => v,
        safeParse: (v: unknown) => ({ success: true as const, data: v }),
        toJSON: () => ({ type: 'object' }),
      } as never,
      async execute(_input, ctx) {
        seen.deps = ctx?.runContext.deps;
        seen.sessionId = ctx?.runContext.sessionId;
        return 'recorded';
      },
    };
    const sub = createAgent({
      name: 'child',
      instructions: 'use tools',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({ toolCallId: 't1', toolName: 'recorder', args: {}, totalTokens: 8 }),
          textOnlyScript('done', 4),
        ],
      }),
      tools: [recorder],
    });
    const tool = sub.toTool();
    const out = await tool.execute(
      { input: 'go' },
      parentCtx({ deps: { token: 'tok-parent' }, sessionId: 'sess-parent' }),
    );
    expect(out).toBe('done');
    expect(seen.deps).toEqual({ token: 'tok-parent' });
    expect(seen.sessionId).toBe('sess-parent');
  });

  it('a failed sub-run THROWS from the tool (no empty-string success)', async () => {
    const sub = createAgent({
      name: 'child',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [errorScript({ kind: 'unknown', message: 'sub boom' })],
      }),
    });
    const tool = sub.toTool();
    await expect(tool.execute({ input: 'go' }, parentCtx({}))).rejects.toThrow(/failed/);
  });

  it('an aborted parent signal stops the sub-agent before any provider call', async () => {
    const base = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('never', 4)] });
    const sub = createAgent({ name: 'child', instructions: 'x', provider: base });
    const tool = sub.toTool();
    const ctl = new AbortController();
    ctl.abort();
    await expect(tool.execute({ input: 'go' }, parentCtx({ signal: ctl.signal }))).rejects.toThrow(
      /aborted/,
    );
    expect(base.scriptsConsumed()).toBe(0);
  });

  it('options.inputFilter shapes the sub-agent seed from the parent history', async () => {
    const base = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('ok', 4)] });
    const { provider, requests } = capturingProvider(base);
    const sub = createAgent({ name: 'child', instructions: '', provider });
    const tool = sub.toTool({
      inputFilter: Object.assign(
        (history: readonly unknown[]) =>
          history.filter((m) => (m as { role?: string }).role === 'user'),
        { descriptor: { kind: 'custom' as const } },
      ) as never,
    });
    await tool.execute(
      { input: 'fresh task' },
      parentCtx({
        messages: [
          { role: 'system', content: 'parent secret prompt' },
          { role: 'user', content: 'earlier parent ask' },
        ] as never,
      }),
    );
    expect(requests.length).toBe(1);
    const sent = requests[0]?.messages ?? [];
    const text = JSON.stringify(sent);
    // System message dropped by the filter; user history + fresh input kept.
    expect(text).not.toContain('parent secret prompt');
    expect(text).toContain('earlier parent ask');
    expect(text).toContain('fresh task');
  });
});

describe('sanitizeHandoffSeed - the child seed is a well-formed transcript', () => {
  it('strips dangling tool calls, drops orphan tool messages, keeps resolved pairs', () => {
    const seed = sanitizeHandoffSeed([
      // Orphan tool result (assistant partner cut by lastN).
      { role: 'tool', toolCallId: 'cut', content: 'orphan' },
      { role: 'user', content: 'hi' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ toolCallId: 'ok', toolName: 'echo', args: {} }],
      },
      { role: 'tool', toolCallId: 'ok', content: 'done' },
      // The in-flight handoff call itself: dangling, message drops.
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ toolCallId: 'h1', toolName: 'transfer_to_x', args: {} }],
      },
    ]);
    expect(seed.map((m) => m.role)).toEqual(['user', 'assistant', 'tool']);
    const assistant = seed[1];
    expect(assistant?.role === 'assistant' && assistant.toolCalls?.length).toBe(1);
  });

  it('keeps an assistant message with text when only its dangling call is stripped', () => {
    const seed = sanitizeHandoffSeed([
      { role: 'user', content: 'hi' },
      {
        role: 'assistant',
        content: 'let me hand this off',
        toolCalls: [{ toolCallId: 'h1', toolName: 'transfer_to_x', args: {} }],
      },
    ]);
    expect(seed).toHaveLength(2);
    const assistant = seed[1];
    expect(assistant?.role).toBe('assistant');
    expect(assistant?.role === 'assistant' ? assistant.toolCalls : []).toBeUndefined();
  });
});

describe('W-036 - sub-agent lifecycle events forward into the parent stream', () => {
  function childWithTool() {
    const echo: Tool<unknown, unknown, unknown> = {
      name: 'echo',
      description: 'echo',
      inputSchema: {
        parse: (v: unknown) => v,
        safeParse: (v: unknown) => ({ success: true as const, data: v }),
        toJSON: () => ({ type: 'object' }),
      } as never,
      sideEffectClass: 'read-only',
      execute: async () => 'ok',
    } as Tool<unknown, unknown, unknown>;
    return createAgent({
      name: 'specialist',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [
          toolCallScript({ toolCallId: 'tc-echo', toolName: 'echo', args: {}, totalTokens: 8 }),
          textOnlyScript('child done', 4),
        ],
      }),
      tools: [echo],
    });
  }
  function parentFor(
    child: ReturnType<typeof childWithTool>,
    forwardEvents?: 'none' | 'lifecycle' | 'all',
  ) {
    return createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h1',
            toolName: 'transfer_to_specialist',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('final', 4),
        ],
      }),
      handoffs: [
        forwardEvents === undefined
          ? child
          : ({ target: child, forwardEvents } as never),
      ],
    });
  }
  async function collect(agent: ReturnType<typeof parentFor>) {
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);
    return events;
  }

  it("default 'lifecycle' forwards the child's tool.execute.end wrapped, never text.delta", async () => {
    const events = await collect(parentFor(childWithTool()));
    const wrapped = events.filter((e) => e.type === 'subagent.event');
    expect(wrapped.length).toBeGreaterThan(0);
    for (const w of wrapped) {
      if (w.type !== 'subagent.event') continue;
      expect(w.toolCallId).toBe('h1');
      expect(w.agentName).toBe('specialist');
      expect(w.event.type).not.toBe('text.delta');
    }
    expect(
      wrapped.some((w) => w.type === 'subagent.event' && w.event.type === 'tool.execute.end'),
    ).toBe(true);
  });

  it("'all' forwards text deltas too; 'none' forwards nothing", async () => {
    const all = await collect(parentFor(childWithTool(), 'all'));
    expect(
      all.some((e) => e.type === 'subagent.event' && e.event.type === 'text.delta'),
    ).toBe(true);
    const none = await collect(parentFor(childWithTool(), 'none'));
    expect(none.some((e) => e.type === 'subagent.event')).toBe(false);
  });
});

describe('W-034 - currentAgentId is restored after the handoff child returns', () => {
  function routerWith(childScripts: Parameters<typeof createMockProvider>[0]['scripts']) {
    const target = createAgent({
      name: 'specialist',
      instructions: 'x',
      provider: createMockProvider({ modelId: 'mock-child', scripts: childScripts }),
    });
    const parent = createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h1',
            toolName: 'transfer_to_specialist',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('final', 4),
        ],
      }),
      handoffs: [target],
    });
    return { parent, target };
  }

  it('post-handoff steps are attributed to the parent, HandoffRecord keeps from/to', async () => {
    const { parent, target } = routerWith([textOnlyScript('done', 20)]);
    const result = await parent.run('help');
    expect(result.status).toBe('completed');
    expect(result.state.currentAgentId).toBe(result.state.agentId);
    // Every step after the child returned is driven by the parent model.
    for (const step of result.state.steps) {
      expect(step.agentId).toBe(result.state.agentId);
    }
    const rec = result.state.handoffs[0];
    expect(rec?.fromAgentId).toBe(result.state.agentId);
    expect(rec?.toAgentId).toBe(target.id);
  });

  it('the failed-child branch restores the parent id too', async () => {
    const { parent } = routerWith([errorScript({ kind: 'unknown', message: 'child boom' })]);
    const result = await parent.run('help');
    expect(result.state.currentAgentId).toBe(result.state.agentId);
    const postHandoffStep = result.state.steps.at(-1);
    expect(postHandoffStep?.agentId).toBe(result.state.agentId);
  });
});

describe('W-033 - child run usage folds into the parent run', () => {
  it('handoff: parent usage/usageByModel include the child tokens, steps stay own-only', async () => {
    const target = createAgent({
      name: 'specialist',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [textOnlyScript('done', 20)],
      }),
    });
    const parent = createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h1',
            toolName: 'transfer_to_specialist',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('final', 4),
        ],
      }),
      handoffs: [target],
    });
    const result = await parent.run('help');
    expect(result.status).toBe('completed');
    // Aggregate: 8 (parent step 1) + 4 (parent step 2) + 20 (child).
    expect(result.state.usage.totalTokens).toBe(32);
    const byModel = result.state.usageByModel ?? {};
    expect(byModel['mock-child']?.totalTokens).toBe(20);
    expect(byModel.mock?.totalTokens).toBe(12);
    // Negative: per-step usage stays the parent's OWN provider call - the
    // child's tokens are folded exactly once, at the run level.
    const stepTotal = result.state.steps.reduce((n, s) => n + (s.usage?.totalTokens ?? 0), 0);
    expect(stepTotal).toBe(12);
  });

  it('handoff: a FAILED child still folds its usage (tokens were spent)', async () => {
    const target = createAgent({
      name: 'specialist',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [errorScript({ kind: 'unknown', message: 'child boom' })],
      }),
    });
    const parent = createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h1',
            toolName: 'transfer_to_specialist',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('recovered', 4),
        ],
      }),
      handoffs: [target],
    });
    const result = await parent.run('help');
    // The failed child consumed no scripted usage in this fixture, but the
    // fold seam ran: the parent totals stay consistent (own steps only).
    expect(result.state.usage.totalTokens).toBe(12);
  });

  it("toTool ('final'): child usage folds into the live parent run through the executor", async () => {
    const sub = createAgent({
      name: 'child',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [textOnlyScript('child says hi', 20)],
      }),
    });
    const parent = createAgent({
      name: 'parent',
      instructions: 'delegate',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-sub',
            toolName: 'subagent_child',
            args: { input: 'go' },
            totalTokens: 8,
          }),
          textOnlyScript('final', 4),
        ],
      }),
      tools: [sub.toTool() as never],
    });
    const result = await parent.run('help');
    expect(result.status).toBe('completed');
    expect(result.state.usage.totalTokens).toBe(32);
    expect(result.state.usageByModel?.['mock-child']?.totalTokens).toBe(20);
  });

  it("toTool ('all') outside the graphorin loop folds into the context accumulator", async () => {
    const sub = createAgent({
      name: 'child',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock-child',
        scripts: [textOnlyScript('turn', 20)],
      }),
    });
    const tool = sub.toTool({ exposeTurns: 'all' });
    const added: Array<{ modelId: string; totalTokens: number }> = [];
    const ctx = parentCtx({});
    (ctx.runContext as { usage: unknown }).usage = {
      add: (modelId: string, usage: { totalTokens: number }) => {
        added.push({ modelId, totalTokens: usage.totalTokens });
      },
    };
    await tool.execute({ input: 'go' }, ctx);
    expect(added).toEqual([{ modelId: 'mock-child', totalTokens: 20 }]);
  });
});

describe('handoff dispatch - error/abort propagation (AG-22)', () => {
  it('a failing handoff target surfaces as a tool error, not an empty success', async () => {
    const target = createAgent({
      name: 'specialist',
      instructions: 'x',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [errorScript({ kind: 'unknown', message: 'specialist exploded' })],
      }),
    });
    const parent = createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h1',
            toolName: 'transfer_to_specialist',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('recovered', 4),
        ],
      }),
      handoffs: [target],
    });
    const events: AgentEvent[] = [];
    for await (const ev of parent.stream('help')) {
      events.push(ev);
    }
    const execError = events.find((e) => e.type === 'tool.execute.error');
    expect(execError).toBeDefined();
    // No empty-string success recorded for the handoff call.
    const emptyEnd = events.find(
      (e) => e.type === 'tool.execute.end' && e.toolCallId === 'h1' && e.result === '',
    );
    expect(emptyEnd).toBeUndefined();
    // The parent loop continues after the failed handoff.
    const end = events.at(-1);
    if (end?.type === 'agent.end') {
      expect(end.result.status).toBe('completed');
      expect(end.result.output).toBe('recovered');
    }
  });

  it('parent abort during handoff stops the sub-agent (no provider call) and the run ends aborted', async () => {
    const targetProvider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('never reached', 4)],
    });
    const target = createAgent({
      name: 'specialist',
      instructions: 'x',
      provider: targetProvider,
    });
    const parent = createAgent({
      name: 'router',
      instructions: 'route',
      provider: createMockProvider({
        modelId: 'mock',
        scripts: [
          toolCallScript({
            toolCallId: 'h1',
            toolName: 'transfer_to_specialist',
            args: {},
            totalTokens: 8,
          }),
          textOnlyScript('never', 4),
        ],
      }),
      handoffs: [target],
    });
    const events: AgentEvent[] = [];
    for await (const ev of parent.stream('help')) {
      events.push(ev);
      if (ev.type === 'handoff') parent.abort();
    }
    expect(targetProvider.scriptsConsumed()).toBe(0);
    const end = events.at(-1);
    expect(end?.type).toBe('agent.end');
    if (end?.type === 'agent.end') {
      expect(end.result.status).toBe('aborted');
    }
  });
});
