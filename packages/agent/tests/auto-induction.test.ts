import type { Tool } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

/**
 * Wave-D D4 - opt-in auto-induction: a COMPLETED run at or above the
 * complexity thresholds is distilled via
 * `memory.procedural.induceFromRun`; failed runs and under-threshold
 * runs never induce; induction failures WARN once and never fail the
 * run.
 */

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

function inductionMemory(behavior: 'record' | 'throw' = 'record'): {
  memory: Memory;
  calls: Array<{ scope: { userId: string }; steps: number }>;
} {
  const calls: Array<{ scope: { userId: string }; steps: number }> = [];
  const memory = {
    tools: [],
    contextEngine: {
      async shouldCompact() {
        return false;
      },
      async compactNow() {
        throw new Error('must not be called');
      },
    },
    procedural: {
      async induceFromRun(scope: { userId: string }, run: { steps: ReadonlyArray<unknown> }) {
        if (behavior === 'throw') throw new Error('inducer down');
        calls.push({ scope, steps: run.steps.length });
        return { id: 'rule_1', status: 'quarantined' };
      },
    },
  } as unknown as Memory;
  return { memory, calls };
}

function threeStepScripts() {
  return [
    toolCallScript({ toolCallId: 'tc-1', toolName: 'noop', args: { v: 1 }, totalTokens: 10 }),
    toolCallScript({ toolCallId: 'tc-2', toolName: 'noop', args: { v: 2 }, totalTokens: 10 }),
    toolCallScript({ toolCallId: 'tc-3', toolName: 'noop', args: { v: 3 }, totalTokens: 10 }),
    textOnlyScript('done', 10),
  ];
}

describe('procedureInduction.auto (wave-D D4)', () => {
  it('induces after a completed run above the thresholds, with the run identity scope', async () => {
    const { memory, calls } = inductionMemory();
    const agent = createAgent({
      name: 'inducer',
      instructions: 'work',
      provider: createMockProvider({ modelId: 'mock', scripts: threeStepScripts() }),
      tools: [noopTool],
      memory,
      procedureInduction: { auto: true },
    });
    const result = await agent.run('go', { userId: 'alex', sessionId: 'sess-9' });
    expect(result.status).toBe('completed');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.scope.userId).toBe('alex');
    expect(calls[0]?.steps).toBeGreaterThanOrEqual(3);
  });

  it('never induces below the thresholds, when disabled, or on failed runs', async () => {
    const { memory, calls } = inductionMemory();
    // One-step run: below minSteps/minToolCalls defaults.
    const simple = createAgent({
      name: 'simple',
      instructions: 'work',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('hi', 5)] }),
      memory,
      procedureInduction: { auto: true },
    });
    await simple.run('go');
    expect(calls).toHaveLength(0);

    // Default off: a complex run with no procedureInduction config.
    const off = createAgent({
      name: 'off',
      instructions: 'work',
      provider: createMockProvider({ modelId: 'mock', scripts: threeStepScripts() }),
      tools: [noopTool],
      memory,
    });
    await off.run('go');
    expect(calls).toHaveLength(0);

    // Failed run (budget throw cuts it): never induces.
    const failing = createAgent({
      name: 'failing',
      instructions: 'work',
      provider: createMockProvider({ modelId: 'mock', scripts: threeStepScripts() }),
      tools: [noopTool],
      memory,
      procedureInduction: { auto: true, minSteps: 1, minToolCalls: 1 },
    });
    const failed = await failing.run('go', { budget: { maxTokens: 5 } });
    expect(failed.status).toBe('failed');
    expect(calls).toHaveLength(0);
  });

  it('an inducer failure WARNs and the run still completes', async () => {
    const { memory } = inductionMemory('throw');
    const warns: string[] = [];
    const original = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array) => {
      warns.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    try {
      const agent = createAgent({
        name: 'resilient',
        instructions: 'work',
        provider: createMockProvider({ modelId: 'mock', scripts: threeStepScripts() }),
        tools: [noopTool],
        memory,
        procedureInduction: { auto: true },
      });
      const result = await agent.run('go');
      expect(result.status).toBe('completed');
      expect(warns.some((w) => w.includes('procedureInduction.auto'))).toBe(true);
    } finally {
      process.stderr.write = original;
    }
  });
});
