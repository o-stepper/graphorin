import type { AgentEvent, ProviderEvent, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  createMockProvider,
  type MockProviderScript,
  textOnlyScript,
} from './fixtures/mock-provider.js';

// --- shared fixtures --------------------------------------------------------

/** Minimal pass-through input schema (no zod dep in `@graphorin/agent`). */
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
    sideEffectClass: 'read-only',
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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tracks concurrent executions: each tool increments `active` on entry and
 * decrements on exit, recording the peak (`maxConcurrent`) and the order in
 * which calls completed.
 */
interface ConcurrencyTracker {
  active: number;
  maxConcurrent: number;
  readonly completionOrder: string[];
}
function makeTracker(): ConcurrencyTracker {
  return { active: 0, maxConcurrent: 0, completionOrder: [] };
}

/** A read-only tool that records overlap into `tracker` and sleeps `delayMs`. */
function trackedTool(
  name: string,
  tracker: ConcurrencyTracker,
  delayMs: number,
  result: string,
  extra: Partial<Tool<unknown, unknown, unknown>> = {},
): Tool<unknown, unknown, unknown> {
  return makeTool(
    name,
    async () => {
      tracker.active += 1;
      tracker.maxConcurrent = Math.max(tracker.maxConcurrent, tracker.active);
      await sleep(delayMs);
      tracker.completionOrder.push(name);
      tracker.active -= 1;
      return result;
    },
    extra,
  );
}

// --- WI-04: parallel tool dispatch ------------------------------------------

describe('parallel tool dispatch (WI-04)', () => {
  it('runs two independent tools in one step concurrently', async () => {
    const tracker = makeTracker();
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
      name: 'parallel',
      instructions: 'noop',
      provider,
      tools: [trackedTool('alpha', tracker, 25, 'A'), trackedTool('beta', tracker, 25, 'B')],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    // Both calls were in flight at the same time (default maxParallelTools = 8).
    expect(tracker.maxConcurrent).toBe(2);
  });

  it('emits results in call order regardless of completion order', async () => {
    const tracker = makeTracker();
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        multiToolCallScript([
          { toolCallId: 'tc-a', toolName: 'slow', args: {} },
          { toolCallId: 'tc-b', toolName: 'fast', args: {} },
        ]),
        textOnlyScript('done', 4),
      ],
    });
    const agent = createAgent({
      name: 'ordering',
      instructions: 'noop',
      provider,
      tools: [trackedTool('slow', tracker, 40, 'SLOW'), trackedTool('fast', tracker, 0, 'FAST')],
    });

    const endOrder: string[] = [];
    const results = new Map<string, unknown>();
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'tool.execute.end') {
        endOrder.push(ev.toolCallId);
        results.set(ev.toolCallId, ev.result);
      }
    }

    // `fast` finishes before `slow` (proves completion order is reversed)...
    expect(tracker.completionOrder).toEqual(['fast', 'slow']);
    // ...yet `tool.execute.end` is emitted in the original call order, and
    // each result maps to its own call id (executor writes results by index).
    expect(endOrder).toEqual(['tc-a', 'tc-b']);
    expect(results.get('tc-a')).toBe('SLOW');
    expect(results.get('tc-b')).toBe('FAST');
  });

  it('serialises calls when maxParallelTools is 1', async () => {
    const tracker = makeTracker();
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
      name: 'serial',
      instructions: 'noop',
      provider,
      maxParallelTools: 1,
      tools: [trackedTool('alpha', tracker, 15, 'A'), trackedTool('beta', tracker, 15, 'B')],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    // maxParallelTools = 1 dispatches the next call only after the prior settles.
    expect(tracker.maxConcurrent).toBe(1);
  });

  it('never overlaps tools declaring executionMode: sequential', async () => {
    const tracker = makeTracker();
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        multiToolCallScript([
          { toolCallId: 'tc-a', toolName: 'seq_a', args: {} },
          { toolCallId: 'tc-b', toolName: 'seq_b', args: {} },
        ]),
        textOnlyScript('done', 4),
      ],
    });
    const agent = createAgent({
      name: 'sequential',
      instructions: 'noop',
      provider,
      // Default maxParallelTools (8) - sequential tools must still serialise.
      tools: [
        trackedTool('seq_a', tracker, 15, 'A', { executionMode: 'sequential' }),
        trackedTool('seq_b', tracker, 15, 'B', { executionMode: 'sequential' }),
      ],
    });

    const endOrder: string[] = [];
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'tool.execute.end') endOrder.push(ev.toolCallId);
    }

    expect(tracker.maxConcurrent).toBe(1);
    // Ordering still deterministic (call order) for sequential tools.
    expect(endOrder).toEqual(['tc-a', 'tc-b']);
  });

  it('keys interleaved lifecycle events by toolCallId across a concurrent batch', async () => {
    const tracker = makeTracker();
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
      name: 'keyed',
      instructions: 'noop',
      provider,
      tools: [trackedTool('alpha', tracker, 20, 'A'), trackedTool('beta', tracker, 20, 'B')],
    });

    const startIds: string[] = [];
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) {
      events.push(ev);
      if (ev.type === 'tool.execute.start') startIds.push(ev.toolCallId);
    }

    // Every concurrent call gets its own start/end pair, keyed by toolCallId.
    expect(startIds).toEqual(['tc-a', 'tc-b']);
    const endIds = events
      .filter(
        (e): e is Extract<AgentEvent, { type: 'tool.execute.end' }> =>
          e.type === 'tool.execute.end',
      )
      .map((e) => e.toolCallId);
    expect(endIds).toEqual(['tc-a', 'tc-b']);
  });
});
