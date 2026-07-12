import type { Tool } from '@graphorin/core';
import { describe, expect, it, vi } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  createMockProvider,
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

/**
 * C5 (W-084 residual, D-8): run-level budget - a between-step precheck
 * against the run's accumulated usage. The step that crosses a ceiling
 * completes (documented in-flight overshoot); the run stops before the
 * next provider call with a typed outcome ('stop') or a rejected
 * promise ('throw').
 */

/** A text-only script whose finish usage carries a USD cost figure. */
function pricedScript(text: string, totalTokens: number, costUsd: number): MockProviderScript {
  const base = textOnlyScript(text, totalTokens);
  const events = base.events.map((ev) =>
    ev.type === 'finish'
      ? { ...ev, usage: { ...ev.usage, cost: { amount: costUsd, currency: 'USD' } } }
      : ev,
  );
  return { events };
}

/** A tool-call script whose finish usage carries a USD cost figure. */
function pricedToolCallScript(args: {
  readonly toolCallId: string;
  readonly totalTokens: number;
  readonly costUsd: number;
}): MockProviderScript {
  const base = toolCallScript({
    toolCallId: args.toolCallId,
    toolName: 'noop',
    args: { value: 'x' },
    totalTokens: args.totalTokens,
  });
  const events = base.events.map((ev) =>
    ev.type === 'finish'
      ? { ...ev, usage: { ...ev.usage, cost: { amount: args.costUsd, currency: 'USD' } } }
      : ev,
  );
  return { events };
}

/** Minimal pass-through input schema (no zod dep in `@graphorin/agent`). */
const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

const noopTool = {
  name: 'noop',
  description: 'does nothing',
  inputSchema: passthroughSchema,
  sideEffectClass: 'read-only',
  execute: async () => 'ok',
} as Tool<unknown, unknown, unknown>;

describe('C5: run-level budget', () => {
  it('maxTokens stop: the crossing step completes, the run fails typed before the next step', async () => {
    const provider = createMockProvider({
      modelId: 'mock-budget',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-1',
          toolName: 'noop',
          args: { value: 'a' },
          totalTokens: 40,
        }),
        toolCallScript({
          toolCallId: 'tc-2',
          toolName: 'noop',
          args: { value: 'b' },
          totalTokens: 40,
        }),
        textOnlyScript('never reached', 40),
      ],
    });
    const agent = createAgent({
      name: 'budgeted',
      instructions: 'work',
      provider,
      tools: [noopTool],
    });
    const result = await agent.run('go', { budget: { maxTokens: 50 } });
    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('budget-exceeded');
    expect(result.error?.message).toContain('RunBudget.maxTokens');
    // Step 1 (40 tokens) passed the check; step 2 (80 total) crossed it;
    // the third script was never consumed - between-step semantics.
    expect(provider.scriptsConsumed()).toBe(2);
    expect(result.usage.totalTokens).toBe(80);
  });

  it('maxCostUsd stop: reads the accumulated USD cost from priced usage', async () => {
    const provider = createMockProvider({
      modelId: 'mock-cost',
      scripts: [
        pricedToolCallScript({ toolCallId: 'tc-1', totalTokens: 10, costUsd: 0.02 }),
        pricedScript('never reached', 10, 0.02),
      ],
    });
    const agent = createAgent({
      name: 'cost-budgeted',
      instructions: 'work',
      provider,
      tools: [noopTool],
    });
    const result = await agent.run('go', { budget: { maxCostUsd: 0.01 } });
    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('budget-exceeded');
    expect(result.error?.message).toContain('RunBudget.maxCostUsd');
    expect(provider.scriptsConsumed()).toBe(1);
    // The run-level aggregate now folds reported cost (C5).
    expect(result.usage.cost).toEqual({ amount: 0.02, currency: 'USD' });
  });

  it("onExceed 'throw' rejects the run with AgentBudgetExceededError", async () => {
    const provider = createMockProvider({
      modelId: 'mock-throw',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-1',
          toolName: 'noop',
          args: { value: 'a' },
          totalTokens: 40,
        }),
      ],
    });
    const agent = createAgent({
      name: 'throwing',
      instructions: 'work',
      provider,
      tools: [noopTool],
    });
    await expect(
      agent.run('go', { budget: { maxTokens: 10, onExceed: 'throw' } }),
    ).rejects.toMatchObject({
      name: 'AgentBudgetExceededError',
      code: 'budget-exceeded',
      resource: 'tokens',
      observed: 40,
      limit: 10,
    });
  });

  it('a run under budget completes normally', async () => {
    const provider = createMockProvider({
      modelId: 'mock-under',
      scripts: [pricedScript('done', 10, 0.001)],
    });
    const agent = createAgent({ name: 'thrifty', instructions: 'work', provider });
    const result = await agent.run('go', { budget: { maxTokens: 1_000, maxCostUsd: 1 } });
    expect(result.status).toBe('completed');
    expect(result.output).toBe('done');
  });

  it('sub-agent usage counts against the parent budget (W-033 fold)', async () => {
    const childProvider = createMockProvider({
      modelId: 'child',
      scripts: [pricedScript('child-answer', 60, 0.05)],
    });
    const child = createAgent({ name: 'worker', instructions: 'work', provider: childProvider });
    const parentProvider = createMockProvider({
      modelId: 'parent',
      scripts: [
        toolCallScript({
          toolCallId: 'tc-1',
          toolName: 'sub_invoke',
          args: { input: 'delegate' },
          totalTokens: 10,
        }),
        textOnlyScript('never reached', 10),
      ],
    });
    const parent = createAgent({
      name: 'manager',
      instructions: 'delegate',
      provider: parentProvider,
      tools: [child.toTool({ name: 'sub_invoke' })],
    });
    const result = await parent.run('go', { budget: { maxTokens: 50 } });
    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('budget-exceeded');
    // Parent step (10) + child run (60) = 70 > 50; the child cost folded too.
    expect(result.usage.totalTokens).toBe(70);
    expect(result.usage.cost).toEqual({ amount: 0.05, currency: 'USD' });
    expect(parentProvider.scriptsConsumed()).toBe(1);
  });

  it('WARNs once when maxCostUsd is set but the usage carries no USD cost', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const provider = createMockProvider({
        modelId: 'mock-unpriced',
        scripts: [
          toolCallScript({
            toolCallId: 'tc-1',
            toolName: 'noop',
            args: { value: 'a' },
            totalTokens: 10,
          }),
          textOnlyScript('done', 10),
        ],
      });
      const agent = createAgent({
        name: 'unpriced',
        instructions: 'work',
        provider,
        tools: [noopTool],
      });
      const result = await agent.run('go', { budget: { maxCostUsd: 0.01 } });
      expect(result.status).toBe('completed');
      const budgetWarns = warnSpy.mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('cost ceiling is UNENFORCED'),
      );
      expect(budgetWarns.length).toBe(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('rejects a malformed budget synchronously', async () => {
    const provider = createMockProvider({ modelId: 'mock-bad', scripts: [] });
    const agent = createAgent({ name: 'bad-budget', instructions: 'work', provider });
    await expect(agent.run('go', { budget: { maxTokens: -1 } })).rejects.toThrow(
      /RunBudget.maxTokens/,
    );
    await expect(agent.run('go', { budget: { maxCostUsd: Number.NaN } })).rejects.toThrow(
      /RunBudget.maxCostUsd/,
    );
  });
});
