/**
 * Coverage for `withCostLimit` — over-limit throw path, warn-only mode,
 * and the no-op behaviour when no resolver is wired.
 */
import type { Provider, ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { CostBudgetExceededError } from '../../src/errors/errors.js';
import { withCostLimit } from '../../src/middleware/with-cost-limit.js';
import { bareAdapter } from '../fixtures/bare-adapter.js';

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

function failingResolver(value: number): () => number {
  return () => value;
}

describe('withCostLimit', () => {
  it('throws CostBudgetExceededError when the session resolver exceeds the limit', async () => {
    const wrapped = withCostLimit({
      maxPerSession: 1,
      resolveObservedCost: failingResolver(2),
    })(bareAdapter());
    await expect(wrapped.generate(REQ)).rejects.toBeInstanceOf(CostBudgetExceededError);
  });

  it('throws on the run scope', async () => {
    const wrapped = withCostLimit({
      maxPerRun: 1,
      resolveObservedCost: failingResolver(2),
    })(bareAdapter());
    await expect(wrapped.generate(REQ)).rejects.toBeInstanceOf(CostBudgetExceededError);
  });

  it('throws on the hour scope', async () => {
    const wrapped = withCostLimit({
      maxPerHour: 1,
      resolveObservedCost: failingResolver(2),
    })(bareAdapter());
    await expect(wrapped.generate(REQ)).rejects.toBeInstanceOf(CostBudgetExceededError);
  });

  it('only logs (does not throw) when onExceed is "warn"', async () => {
    const calls: Array<{ message: string }> = [];
    const wrapped = withCostLimit({
      maxPerSession: 1,
      onExceed: 'warn',
      resolveObservedCost: failingResolver(2),
      logger: (message) => calls.push({ message }),
    })(bareAdapter());
    await expect(wrapped.generate(REQ)).resolves.toBeDefined();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]?.message).toContain('budget breach');
  });

  it('is a no-op when resolveObservedCost is unset', async () => {
    const wrapped = withCostLimit({})(bareAdapter());
    await expect(wrapped.generate(REQ)).resolves.toBeDefined();
  });

  it('does not throw when the observed cost is below the limit', async () => {
    const wrapped = withCostLimit({
      maxPerSession: 10,
      resolveObservedCost: failingResolver(1),
    })(bareAdapter());
    await expect(wrapped.generate(REQ)).resolves.toBeDefined();
  });

  it('also gates the streaming surface', async () => {
    const wrapped = withCostLimit({
      maxPerSession: 1,
      resolveObservedCost: failingResolver(2),
    })(bareAdapter());
    expect(() => wrapped.stream(REQ)).toThrow(CostBudgetExceededError);
  });

  it('passes metadata through to the resolver', async () => {
    let captured: unknown;
    const wrapped = withCostLimit({
      maxPerSession: 100,
      resolveObservedCost: (_scope, metadata) => {
        captured = metadata;
        return 0;
      },
    })(bareAdapter() as unknown as Provider);
    await wrapped.generate({
      ...REQ,
      metadata: { sessionId: 's1', runId: 'r1' },
    });
    expect(captured).toMatchObject({ sessionId: 's1', runId: 'r1' });
  });

  it('reports CostBudgetExceededError with the correct scope/limit/observed', async () => {
    const wrapped = withCostLimit({
      maxPerSession: 0.5,
      resolveObservedCost: failingResolver(1.25),
    })(bareAdapter());
    try {
      await wrapped.generate(REQ);
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(CostBudgetExceededError);
      const e = err as CostBudgetExceededError;
      expect(e.scope).toBe('session');
      expect(e.limit).toBe(0.5);
      expect(e.observed).toBe(1.25);
    }
  });

  it('warns once when ceilings are configured without a resolver (PS-8)', () => {
    const warnings: string[] = [];
    const logger = (m: string): void => {
      warnings.push(m);
    };
    // Ceilings set but no resolver ⇒ silently unenforced; must be loud.
    withCostLimit({ maxPerSession: 10, logger });
    expect(warnings.some((w) => /resolveObservedCost|unenforced|no-op/i.test(w))).toBe(true);
    expect(warnings).toHaveLength(1);
  });

  it('does not warn when no ceilings are configured (intentional placeholder)', () => {
    const warnings: string[] = [];
    withCostLimit({ logger: (m: string) => warnings.push(m) });
    expect(warnings).toHaveLength(0);
  });
});
