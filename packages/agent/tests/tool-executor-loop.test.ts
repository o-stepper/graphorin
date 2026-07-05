import type { AgentEvent, ProviderEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  createMockProvider,
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

// --- shared fixtures --------------------------------------------------------

/**
 * Minimal pass-through input schema (no zod dep in `@graphorin/agent`).
 * Mirrors the hand-rolled schema used across the agent test suite.
 */
const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

/** Build a plain `Tool` whose `execute` is supplied by the caller. */
function makeTool(
  name: string,
  execute: Tool<unknown, unknown, unknown>['execute'],
  extra: Partial<Tool<unknown, unknown, unknown>> = {},
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'pure',
    execute,
    ...extra,
  } as Tool<unknown, unknown, unknown>;
}

/** Provider script that emits several tool calls inside a single step. */
function multiToolCallScript(
  calls: ReadonlyArray<{
    readonly toolCallId: string;
    readonly toolName: string;
    readonly args: unknown;
  }>,
): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
  ];
  for (const c of calls) {
    events.push(
      { type: 'tool-call-start', toolCallId: c.toolCallId, toolName: c.toolName },
      {
        type: 'tool-call-input-delta',
        toolCallId: c.toolCallId,
        argsDelta: JSON.stringify(c.args),
      },
      { type: 'tool-call-end', toolCallId: c.toolCallId, finalArgs: c.args },
    );
  }
  events.push({
    type: 'finish',
    finishReason: 'tool-calls',
    usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
  });
  return { events };
}

const echoTool = makeTool('echo', async (input) => `echo:${(input as { msg: string }).msg}`);

// --- golden-trace parity (R10) ----------------------------------------------

describe('ToolExecutor loop wiring - golden-trace parity', () => {
  it('emits the exact happy-path AgentEvent sequence for a single tool call', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'echo', args: { msg: 'hi' } }),
        textOnlyScript('all done', 8),
      ],
    });
    const agent = createAgent({
      name: 'echo-agent',
      instructions: 'noop',
      provider,
      tools: [echoTool],
    });

    const types: string[] = [];
    let endResult: unknown;
    for await (const ev of agent.stream('please echo')) {
      types.push(ev.type);
      if (ev.type === 'tool.execute.end') endResult = ev.result;
    }

    // The full happy-path trace must be byte-identical to the pre-WI-03
    // inline loop: start → end with nothing between, and the executor's
    // (sanitized) output reaches `tool.execute.end.result` verbatim.
    expect(types).toEqual([
      'agent.start',
      'step.start',
      'tool.call.start',
      'tool.call.delta',
      'tool.call.end',
      'tool.execute.start',
      'tool.execute.end',
      'step.end',
      'step.start',
      'text.delta',
      'text.complete',
      'step.end',
      'agent.end',
    ]);
    expect(endResult).toBe('echo:hi');
  });
});

// --- now-enforced tool fields ----------------------------------------------

describe('ToolExecutor loop wiring - activated tool fields', () => {
  it('applies maxResultTokens truncation to the tool result', async () => {
    const big = 'x'.repeat(8000);
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'big', args: {} }),
        textOnlyScript('done', 4),
      ],
    });
    const agent = createAgent({
      name: 'truncating',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('big', async () => big, { maxResultTokens: 8, truncationStrategy: 'middle' }),
      ],
    });

    let endResult = '';
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'tool.execute.end') endResult = ev.result as string;
    }
    // The inline loop forwarded the full 8000-char body untouched; the
    // executor now enforces the per-tool budget.
    expect(endResult.length).toBeLessThan(1000);
    expect(endResult.length).toBeGreaterThan(0);
  });

  it('applies inbound sanitization (detect-and-wrap) to the tool result', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'fetch', args: {} }),
        textOnlyScript('done', 4),
      ],
    });
    const agent = createAgent({
      name: 'sanitizing',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('fetch', async () => 'some external content', {
          inboundSanitization: 'detect-and-wrap',
          sideEffectClass: 'read-only',
        }),
      ],
    });

    let endResult = '';
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'tool.execute.end') endResult = ev.result as string;
    }
    expect(endResult).toContain('untrusted_content');
    expect(endResult).toContain('some external content');
  });

  it('enforces the secretsAllowed ACL - a non-allowlisted secret denies the call', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-secret', toolName: 'leaky', args: {} }),
        textOnlyScript('handled the error', 4),
      ],
    });
    const agent = createAgent({
      name: 'acl',
      instructions: 'noop',
      provider,
      tools: [
        makeTool(
          'leaky',
          async (_input, ctx) => {
            // 'forbidden' is not in secretsAllowed → require() must throw.
            await ctx.secrets.require('forbidden');
            return 'should-not-reach';
          },
          { secretsAllowed: ['allowed'], sideEffectClass: 'read-only' },
        ),
      ],
    });

    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);

    const errEv = events.find((e) => e.type === 'tool.execute.error');
    expect(errEv).toBeDefined();
    if (errEv?.type === 'tool.execute.error') {
      expect(errEv.toolCallId).toBe('tc-secret');
    }
    // The run recovers (the model sees the error message and continues).
    expect(events.some((e) => e.type === 'text.complete')).toBe(true);
  });

  it('surfaces a thrown tool error as tool.execute.error with a stable shape', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-boom', toolName: 'boom', args: {} }),
        textOnlyScript('recovered', 4),
      ],
    });
    const agent = createAgent({
      name: 'errs',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('boom', async () => {
          throw new Error('kaboom');
        }),
      ],
    });

    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);

    const errEv = events.find((e) => e.type === 'tool.execute.error');
    expect(errEv).toBeDefined();
    if (errEv?.type === 'tool.execute.error') {
      expect(errEv.toolCallId).toBe('tc-boom');
      expect(errEv.error.toolName).toBe('boom');
      expect(errEv.error.kind).toBe('execution_failed');
      expect(errEv.error.message).toContain('kaboom');
    }
  });
});

// --- durable HITL preserved -------------------------------------------------

describe('ToolExecutor loop wiring - durable HITL', () => {
  it('pre-screens approval and suspends before the executor runs (start → requested, no end)', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [toolCallScript({ toolCallId: 'tc-x', toolName: 'gated', args: {} })],
    });
    const agent = createAgent({
      name: 'gated-agent',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('gated', async () => 'executed', {
          needsApproval: true,
          sideEffectClass: 'external-stateful',
        }),
      ],
    });

    const types: string[] = [];
    for await (const ev of agent.stream('go')) types.push(ev.type);

    const startIdx = types.indexOf('tool.execute.start');
    const reqIdx = types.indexOf('tool.approval.requested');
    expect(startIdx).toBeGreaterThanOrEqual(0);
    expect(reqIdx).toBe(startIdx + 1);
    // The gated tool must NOT have executed (the run suspended first).
    expect(types).not.toContain('tool.execute.end');
  });
});

// --- prepareStep tool overrides + parallel dispatch -------------------------

describe('ToolExecutor loop wiring - step-scoped + multi-call', () => {
  it('executes a tool supplied only via a prepareStep tools override', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-ov', toolName: 'override_only', args: {} }),
        textOnlyScript('done', 4),
      ],
    });
    const overrideTool = makeTool('override_only', async () => 'override-result');
    const agent = createAgent({
      name: 'override-agent',
      instructions: 'noop',
      provider,
      // No config.tools - the tool exists only for this step.
      prepareStep: () => ({ tools: [overrideTool] }),
    });

    let endResult: unknown;
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'tool.execute.end') endResult = ev.result;
    }
    expect(endResult).toBe('override-result');
  });

  it('dispatches multiple tool calls in one step and maps results by call id', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        multiToolCallScript([
          { toolCallId: 'tc-a', toolName: 'alpha', args: {} },
          { toolCallId: 'tc-b', toolName: 'beta', args: {} },
        ]),
        textOnlyScript('done', 4),
      ],
    });
    const agent = createAgent({
      name: 'parallel-agent',
      instructions: 'noop',
      provider,
      tools: [makeTool('alpha', async () => 'A'), makeTool('beta', async () => 'B')],
    });

    const results = new Map<string, unknown>();
    const starts: string[] = [];
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'tool.execute.start') starts.push(ev.toolCallId);
      if (ev.type === 'tool.execute.end') results.set(ev.toolCallId, ev.result);
    }
    expect(starts).toEqual(['tc-a', 'tc-b']);
    expect(results.get('tc-a')).toBe('A');
    expect(results.get('tc-b')).toBe('B');
  });
});
