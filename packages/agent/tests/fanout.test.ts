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

  it('isolates failed children — never throws from the fan-out call itself', async () => {
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
