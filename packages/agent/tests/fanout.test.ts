import type { AgentEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { runFanOut } from '../src/index.js';

describe('runFanOut', () => {
  it('runs three children with the concat strategy and emits the spawned + merged events', async () => {
    const events: AgentEvent[] = [];
    const r = await runFanOut<string>({
      children: [
        { agentId: 'a', invoke: async () => 'AAA' },
        { agentId: 'b', invoke: async () => 'BBB' },
        { agentId: 'c', invoke: async () => 'CCC' },
      ],
      runId: 'r',
      sessionId: 's',
      agentId: 'parent',
      emit: (e) => events.push(e),
    });
    expect(r.children.length).toBe(3);
    expect(r.output).toContain('AAA');
    expect(r.output).toContain('BBB');
    expect(r.output).toContain('CCC');
    const types = events.map((e) => e.type);
    expect(types).toContain('agent.fanout.spawned');
    expect(types).toContain('agent.fanout.merged');
  });

  it('isolates failed children - never throws from the fan-out call itself', async () => {
    const r = await runFanOut<string>({
      children: [
        { agentId: 'ok', invoke: async () => 'ok' },
        {
          agentId: 'boom',
          invoke: async () => {
            throw new Error('child failure');
          },
        },
      ],
      runId: 'r',
      sessionId: 's',
      agentId: 'p',
    });
    expect(r.children[0]?.status).toBe('completed');
    expect(r.children[1]?.status).toBe('failed');
    expect(r.children[1]?.error?.message).toBe('child failure');
  });

  it('first-success returns the first child that succeeded by registration order', async () => {
    const r = await runFanOut<string>({
      children: [
        {
          agentId: 'first-fail',
          invoke: async () => {
            throw new Error('boom');
          },
        },
        { agentId: 'second-ok', invoke: async () => 'second' },
      ],
      mergeStrategy: { kind: 'first-success' },
      runId: 'r',
      sessionId: 's',
      agentId: 'p',
    });
    expect(r.output).toBe('second');
  });

  it('judge-merge invokes the supplied judge function', async () => {
    let judgeCalled = false;
    const r = await runFanOut<string>({
      children: [
        { agentId: 'a', invoke: async () => 'one' },
        { agentId: 'b', invoke: async () => 'two' },
      ],
      mergeStrategy: {
        kind: 'judge-merge',
        judge: async (children) => {
          judgeCalled = true;
          return children.map((c) => c.output ?? '').join('|');
        },
      },
      runId: 'r',
      sessionId: 's',
      agentId: 'p',
    });
    expect(judgeCalled).toBe(true);
    expect(r.output).toBe('one|two');
  });

  it('respects per-child duration budget', async () => {
    const r = await runFanOut<string>({
      children: [
        {
          agentId: 'slow',
          invoke: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return 'slow';
          },
        },
      ],
      perBudget: { durationMs: 10 },
      runId: 'r',
      sessionId: 's',
      agentId: 'p',
    });
    expect(r.children[0]?.status).toBe('budget-exceeded');
  });
});

describe('runFanOut - merge guard + budgets (AG-7 / AG-16)', () => {
  const lowTrustChild = {
    agentId: 'shady',
    invoke: async () => 'INJECTED PAYLOAD dominating the merge',
    trustClass: 'untrusted-skill' as const,
    origin: 'web-search' as const,
  };

  it("judge-merge with mergeGuard 'detect-and-block' throws MergeBlockedError when a low-trust child dominates", async () => {
    const { MergeBlockedError } = await import('../src/index.js');
    await expect(
      runFanOut<string>({
        children: [{ agentId: 'good', invoke: async () => 'fine' }, lowTrustChild],
        runId: 'r',
        sessionId: 's',
        agentId: 'parent',
        mergeGuard: { strictness: 'detect-and-block' },
        mergeStrategy: {
          kind: 'judge-merge',
          // A compromised judge that parrots the malicious child verbatim.
          judge: async () => 'INJECTED PAYLOAD dominating the merge',
        },
      }),
    ).rejects.toThrow(MergeBlockedError);
  });

  it("judge-merge with 'detect-and-flag' does not throw but emits agent.lateral-leak.detected (vector sideways-injection)", async () => {
    const events: AgentEvent[] = [];
    const r = await runFanOut<string>({
      children: [{ agentId: 'good', invoke: async () => 'fine' }, lowTrustChild],
      runId: 'r',
      sessionId: 's',
      agentId: 'parent',
      emit: (e) => events.push(e),
      mergeGuard: { strictness: 'detect-and-flag' },
      mergeStrategy: {
        kind: 'judge-merge',
        judge: async () => 'INJECTED PAYLOAD dominating the merge',
      },
    });
    expect(r.output).toContain('INJECTED');
    const leak = events.find((e) => e.type === 'agent.lateral-leak.detected');
    expect(leak).toBeDefined();
    if (leak?.type === 'agent.lateral-leak.detected') {
      expect(leak.vector).toBe('sideways-injection');
      expect(leak.causalityChain).toContain('shady');
      expect(leak.decision).toBe('flag');
    }
  });

  it('harvests tokensUsed/toolCallCount when a child returns a full AgentResult', async () => {
    const agentResultShaped = {
      output: 'researched',
      usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
      status: 'completed',
      state: {
        id: 'run_child',
        status: 'completed',
        steps: [
          { stepNumber: 1, toolCalls: [{ toolCallId: 't1' }, { toolCallId: 't2' }] },
          { stepNumber: 2, toolCalls: [{ toolCallId: 't3' }] },
        ],
      },
    };
    const r = await runFanOut<unknown>({
      children: [{ agentId: 'kid', invoke: async () => agentResultShaped }],
      runId: 'r',
      sessionId: 's',
      agentId: 'parent',
    });
    const child = r.children[0];
    expect(child?.status).toBe('completed');
    expect(child?.output).toBe('researched');
    expect(child?.tokensUsed).toBe(50);
    expect(child?.toolCallCount).toBe(3);
  });

  it('enforces the tokens budget post-hoc on usage-reporting children', async () => {
    const r = await runFanOut<unknown>({
      children: [
        {
          agentId: 'hungry',
          invoke: async () => ({
            output: 'expensive',
            usage: { promptTokens: 600, completionTokens: 600, totalTokens: 1200 },
            status: 'completed',
            state: { id: 'run_x', status: 'completed', steps: [] },
          }),
        },
      ],
      runId: 'r',
      sessionId: 's',
      agentId: 'parent',
      perBudget: { tokens: 100 },
    });
    const child = r.children[0];
    expect(child?.status).toBe('budget-exceeded');
    expect(child?.error?.code).toBe('budget-exceeded');
    expect(child?.tokensUsed).toBe(1200);
    // The over-budget output is withheld from the merge.
    expect(child?.output).toBeUndefined();
  });

  it('clears the duration timer when the child REJECTS (no dangling timer)', async () => {
    const { vi } = await import('vitest');
    vi.useFakeTimers();
    try {
      const promise = runFanOut<string>({
        children: [
          {
            agentId: 'boom',
            invoke: async () => {
              throw new Error('immediate failure');
            },
          },
        ],
        runId: 'r',
        sessionId: 's',
        agentId: 'parent',
        perBudget: { durationMs: 60_000 },
      });
      await vi.runAllTicks();
      const r = await promise;
      expect(r.children[0]?.status).toBe('failed');
      // AG-16: the duration timer must be cleared on the rejection path.
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
