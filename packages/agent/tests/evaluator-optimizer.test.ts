import type { AgentEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { EvaluatorOptimizerConfigError, evaluatorOptimizer } from '../src/index.js';

describe('evaluatorOptimizer', () => {
  it('throws when maxIterations < 1', async () => {
    await expect(async () =>
      evaluatorOptimizer<string>('x', {
        generator: async () => 'g',
        evaluator: async () => ({ score: 1, pass: true, critique: '' }),
        maxIterations: 0,
        rubric: { kind: 'free-form', instructions: 'be good' },
        runId: 'r',
        sessionId: 's',
        agentId: 'a',
      }),
    ).rejects.toThrowError(EvaluatorOptimizerConfigError);
  });

  it('terminates as soon as the evaluator returns pass: true', async () => {
    const events: AgentEvent[] = [];
    const r = await evaluatorOptimizer<string>('x', {
      generator: async (_input, critique, iter) => `iter-${iter}-${critique ?? 'none'}`,
      evaluator: async (_i, candidate, _r, iter) => ({
        score: 60 + iter * 10,
        pass: iter >= 2,
        critique: `feedback-${iter}`,
      }),
      maxIterations: 5,
      rubric: { kind: 'free-form', instructions: 'be good' },
      runId: 'r',
      sessionId: 's',
      agentId: 'a',
      emit: (e) => events.push(e),
    });
    expect(r.terminationReason).toBe('pass');
    expect(r.iterations.length).toBe(2);
    expect(events.some((e) => e.type === 'agent.evaluator.iteration')).toBe(true);
    expect(events.some((e) => e.type === 'agent.evaluator.converged')).toBe(true);
  });

  it('terminates at the iteration cap when no iteration passes', async () => {
    const r = await evaluatorOptimizer<string>('x', {
      generator: async () => 'fixed',
      evaluator: async () => ({ score: 50, pass: false, critique: 'still bad' }),
      maxIterations: 3,
      rubric: { kind: 'free-form', instructions: 'be good' },
      runId: 'r',
      sessionId: 's',
      agentId: 'a',
    });
    expect(r.terminationReason).toBe('maxIterations');
    expect(r.iterations.length).toBe(3);
  });

  it('best-score merge picks the highest-scoring iteration', async () => {
    const r = await evaluatorOptimizer<string>('x', {
      generator: async (_input, _crit, iter) => `iter-${iter}`,
      evaluator: async (_i, _c, _r, iter) => ({
        score: iter === 2 ? 100 : 50,
        pass: false,
        critique: '',
      }),
      maxIterations: 3,
      rubric: { kind: 'free-form', instructions: 'be good' },
      runId: 'r',
      sessionId: 's',
      agentId: 'a',
      mergeStrategy: 'best-score',
    });
    expect(r.output).toBe('iter-2');
    expect(r.finalScore).toBe(100);
  });
});
