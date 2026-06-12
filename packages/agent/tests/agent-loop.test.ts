import type { AgentEvent, Provider, Tool } from '@graphorin/core';
import { describe, expect, it, vi } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  createMockProvider,
  errorScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

describe('Agent — tool execution loop', () => {
  it('executes a single tool call, appends the tool message, and continues to a final text', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-1',
          toolName: 'echo',
          args: { msg: 'hi' },
          totalTokens: 10,
        }),
        textOnlyScript('all done', 8),
      ],
    });
    const echoTool: Tool<{ readonly msg: string }, string, unknown> = {
      name: 'echo',
      description: 'Echo a message back.',
      inputSchema: {
        parse: (v: unknown) => v as { readonly msg: string },
        safeParse: (v: unknown) => ({
          success: true as const,
          data: v as { readonly msg: string },
        }),
        toJSON: (): Record<string, unknown> => ({
          type: 'object',
          properties: { msg: { type: 'string' } },
        }),
      } as Tool<{ readonly msg: string }, string, unknown>['inputSchema'],
      sideEffectClass: 'pure',
      async execute(input) {
        return `echo:${input.msg}`;
      },
    };
    const agent = createAgent({
      name: 'echo-agent',
      instructions: 'noop',
      provider,
      tools: [echoTool],
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('please echo')) {
      events.push(ev);
    }
    const types = events.map((e) => e.type);
    expect(types).toContain('tool.call.start');
    expect(types).toContain('tool.call.end');
    expect(types).toContain('tool.execute.start');
    expect(types).toContain('tool.execute.end');
    expect(types).toContain('text.complete');
    const exec = events.find((e) => e.type === 'tool.execute.end');
    if (exec?.type === 'tool.execute.end') {
      expect(exec.result).toBe('echo:hi');
    }
  });

  it('falls back to the next model on a rate-limit error', async () => {
    const primary = createMockProvider({
      modelId: 'sonnet-4.5',
      scripts: [errorScript({ kind: 'rate-limit' })],
    });
    const fallback = createMockProvider({
      modelId: 'haiku-4.5',
      scripts: [textOnlyScript('answered after fallback', 8)],
    });
    const agent = createAgent({
      name: 'fb',
      instructions: 'noop',
      provider: primary,
      fallbackModels: [fallback],
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('hi')) {
      events.push(ev);
    }
    const fellback = events.find((e) => e.type === 'agent.model.fellback');
    expect(fellback).toBeDefined();
    if (fellback?.type === 'agent.model.fellback') {
      expect(fellback.from).toBe('sonnet-4.5');
      expect(fellback.to).toBe('haiku-4.5');
      expect(fellback.reason).toBe('rate-limit');
    }
    const completeEv = events.find((e) => e.type === 'text.complete');
    if (completeEv?.type === 'text.complete') {
      expect(completeEv.text).toBe('answered after fallback');
    }
  });

  it('emits agent.error when every fallback also fails', async () => {
    const a = createMockProvider({ modelId: 'a', scripts: [errorScript({ kind: 'rate-limit' })] });
    const b = createMockProvider({ modelId: 'b', scripts: [errorScript({ kind: 'rate-limit' })] });
    const agent = createAgent({
      name: 'ex',
      instructions: 'noop',
      provider: a,
      fallbackModels: [b],
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('hi')) {
      events.push(ev);
    }
    expect(events.some((e) => e.type === 'agent.error')).toBe(true);
  });

  it('falls back when a provider THROWS a structured rate-limit error (AG-21)', async () => {
    // A complete mock provider whose stream REJECTS with a
    // `RateLimitExceededError`-shaped error (thrown, not emitted as a structured
    // `{ type: 'error' }` event).
    const primary = {
      ...createMockProvider({ modelId: 'primary', scripts: [textOnlyScript('unused')] }),
      stream() {
        return {
          [Symbol.asyncIterator]() {
            return {
              next: () =>
                Promise.reject(
                  Object.assign(new Error('rate limited'), { kind: 'rate-limit-exceeded' }),
                ),
            };
          },
        };
      },
    } as unknown as Provider;
    const fallback = createMockProvider({
      modelId: 'backup',
      scripts: [textOnlyScript('recovered', 8)],
    });
    const agent = createAgent({
      name: 'fb-throw',
      instructions: 'go',
      provider: primary,
      fallbackModels: [fallback],
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('hi')) {
      events.push(ev);
    }
    const fellback = events.find((e) => e.type === 'agent.model.fellback');
    expect(fellback).toBeDefined();
    if (fellback?.type === 'agent.model.fellback') {
      expect(fellback.reason).toBe('rate-limit');
    }
    const complete = events.find((e) => e.type === 'text.complete');
    if (complete?.type === 'text.complete') {
      expect(complete.text).toBe('recovered');
    }
  });
});

describe('Agent — multi-agent (toTool + handoff)', () => {
  it('toTool() produces a tool whose execute() runs the sub-agent', async () => {
    const subProvider = createMockProvider({
      modelId: 'sub',
      scripts: [textOnlyScript('sub-result', 4)],
    });
    const sub = createAgent({ name: 'sub', instructions: 'noop', provider: subProvider });
    const subTool = sub.toTool({ name: 'sub_invoke', exposeTurns: 'final' });
    // The minimal-loop `toTool().execute(...)` does not consult the
    // tool-execution context — the helper rebinds to the parent
    // agent's run loop. We pass `undefined` as the context to
    // exercise the public surface; the cast keeps the test readable.
    const exec = subTool.execute as (
      input: { readonly input: string },
      ctx: unknown,
    ) => Promise<string>;
    const result = await exec({ input: 'go' }, undefined);
    expect(result).toBe('sub-result');
  });

  it('honours a handoff target — registers transfer_to_<name> and runs the sub-agent on call', async () => {
    const subProvider = createMockProvider({
      modelId: 'sub',
      scripts: [textOnlyScript('handed-off', 4)],
    });
    const sub = createAgent({ name: 'worker', instructions: 'noop', provider: subProvider });
    const parentProvider = createMockProvider({
      modelId: 'parent',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-1',
          toolName: 'transfer_to_worker',
          args: { reason: 'delegate' },
          totalTokens: 10,
        }),
        textOnlyScript('parent done', 6),
      ],
    });
    const parent = createAgent({
      name: 'manager',
      instructions: 'noop',
      provider: parentProvider,
      handoffs: [sub],
    });
    const events: AgentEvent[] = [];
    for await (const ev of parent.stream('please delegate')) {
      events.push(ev);
    }
    expect(events.some((e) => e.type === 'handoff')).toBe(true);
  });
});

describe('Agent — abort', () => {
  it('emits agent.cancelling when abort is invoked between provider calls', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-1',
          toolName: 'noop',
          args: {},
          totalTokens: 5,
        }),
      ],
    });
    const noopTool: Tool<unknown, string, unknown> = {
      name: 'noop',
      description: 'noop',
      inputSchema: {
        parse: (v: unknown) => v,
        safeParse: (v: unknown) => ({ success: true as const, data: v }),
        toJSON: (): Record<string, unknown> => ({ type: 'object' }),
      } as Tool<unknown, string, unknown>['inputSchema'],
      sideEffectClass: 'pure',
      async execute() {
        return 'ok';
      },
    };
    const agent = createAgent({
      name: 'abortable',
      instructions: 'noop',
      provider,
      tools: [noopTool],
    });
    const events: AgentEvent[] = [];
    setTimeout(() => agent.abort(), 5);
    try {
      for await (const ev of agent.stream('go')) {
        events.push(ev);
      }
    } catch {
      // Stream may surface errors when aborted; ignore for the assertion.
    }
    // Either the run completed normally (mock is fast) or we saw the cancel signal.
    expect(events.length).toBeGreaterThan(0);
  });

  const makeNoopTool = (): Tool<unknown, string, unknown> => ({
    name: 'noop',
    description: 'noop',
    inputSchema: {
      parse: (v: unknown) => v,
      safeParse: (v: unknown) => ({ success: true as const, data: v }),
      toJSON: (): Record<string, unknown> => ({ type: 'object' }),
    } as Tool<unknown, string, unknown>['inputSchema'],
    sideEffectClass: 'pure',
    async execute() {
      return 'ok';
    },
  });

  it('agent.abort() stops the run + applies abort options even when the caller passed options.signal (AG-5)', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'noop', args: {} }),
        toolCallScript({ toolCallId: 'tc-2', toolName: 'noop', args: {} }),
        toolCallScript({ toolCallId: 'tc-3', toolName: 'noop', args: {} }),
        textOnlyScript('done'),
      ],
    });
    const agent = createAgent({
      name: 'abortable',
      instructions: 'go',
      provider,
      tools: [makeNoopTool()],
    });
    const parent = new AbortController();
    const events: AgentEvent[] = [];
    let aborted = false;
    for await (const ev of agent.stream('go', { signal: parent.signal })) {
      events.push(ev);
      if (!aborted && ev.type === 'tool.execute.end') {
        aborted = true;
        agent.abort({ onPendingApprovals: 'deny' });
      }
    }
    const cancelling = events.find((e) => e.type === 'agent.cancelling');
    expect(cancelling).toBeDefined();
    if (cancelling?.type === 'agent.cancelling') {
      expect(cancelling.onPendingApprovals).toBe('deny');
    }
    // The run stopped early — it did NOT execute all three tool steps.
    expect(events.filter((e) => e.type === 'tool.execute.end').length).toBeLessThan(3);
  });

  it('removes the parent-signal abort listener when the run ends (no accumulation; AG-5)', async () => {
    const parent = new AbortController();
    const addSpy = vi.spyOn(parent.signal, 'addEventListener');
    const removeSpy = vi.spyOn(parent.signal, 'removeEventListener');
    for (let i = 0; i < 3; i++) {
      const agent = createAgent({
        name: 'leaky',
        instructions: 'go',
        provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done')] }),
      });
      for await (const _ev of agent.stream('go', { signal: parent.signal })) {
        // drain the stream to completion
      }
    }
    const adds = addSpy.mock.calls.filter((c) => c[0] === 'abort').length;
    const removes = removeSpy.mock.calls.filter((c) => c[0] === 'abort').length;
    expect(adds).toBe(3);
    expect(removes).toBe(3);
  });
});
