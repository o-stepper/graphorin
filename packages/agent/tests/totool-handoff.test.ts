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

describe('Agent.toTool — context propagation (AG-17)', () => {
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

describe('handoff dispatch — error/abort propagation (AG-22)', () => {
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
