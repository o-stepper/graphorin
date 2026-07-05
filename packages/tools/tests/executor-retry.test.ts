/**
 * C3: transparent bounded retry for transient tool failures. Retries are
 * invisible to the caller (one CompletedToolCall), bounded by
 * maxAttempts, respect ToolRateLimitError.retryAfterMs, and NEVER run
 * for side-effecting tools without an idempotencyKey.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { getCounterForTesting, resetCountersForTesting } from '../src/audit/index.js';
import { tool } from '../src/builder/index.js';
import { createToolExecutor, ToolRateLimitError } from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

function flaky(
  name: string,
  failures: number,
  extra: object = {},
): {
  readonly t: Parameters<ReturnType<typeof createToolRegistry>['register']>[0];
  readonly attempts: () => number;
} {
  let attempts = 0;
  const t = tool({
    name,
    description: 'fails N times then succeeds',
    inputSchema: z.object({}),
    sideEffectClass: 'read-only',
    ...extra,
    execute: async () => {
      attempts += 1;
      if (attempts <= failures) {
        throw new ToolRateLimitError('slow down', { retryAfterMs: 5 });
      }
      return `ok after ${attempts}`;
    },
  });
  return {
    t: t as Parameters<ReturnType<typeof createToolRegistry>['register']>[0],
    attempts: () => attempts,
  };
}

describe('C3 - executor transparent retry', () => {
  it('retries rate_limited up to maxAttempts and returns the eventual success', async () => {
    resetCountersForTesting();
    const registry = createToolRegistry();
    const { t, attempts } = flaky('flaky', 2);
    registry.register(t);
    const executor = createToolExecutor({ registry, retry: { maxAttempts: 3, backoffMs: 1 } });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'flaky', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(attempts()).toBe(3);
    const outcome = completed[0]?.outcome;
    expect(outcome !== undefined && 'output' in outcome && outcome.output).toBe('ok after 3');
    expect(
      getCounterForTesting('tool.executor.retry.total', {
        toolName: 'flaky',
        kind: 'rate_limited',
      }),
    ).toBe(2);
  });

  it('gives up after maxAttempts and surfaces the final rate_limited error', async () => {
    const registry = createToolRegistry();
    const { t, attempts } = flaky('hopeless', 99);
    registry.register(t);
    const executor = createToolExecutor({ registry, retry: { maxAttempts: 2, backoffMs: 1 } });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'hopeless', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(attempts()).toBe(2);
    const outcome = completed[0]?.outcome;
    expect(outcome !== undefined && 'kind' in outcome && outcome.kind).toBe('rate_limited');
  });

  it('is ON by default for rate_limited (no retry config needed)', async () => {
    const registry = createToolRegistry();
    const { t, attempts } = flaky('default-retry', 1);
    registry.register(t);
    const executor = createToolExecutor({ registry });
    // Default backoff is 250ms; one retry keeps the test fast enough.
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'default-retry', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(attempts()).toBe(2);
    const outcome = completed[0]?.outcome;
    expect(outcome !== undefined && 'output' in outcome).toBe(true);
  });

  it('NEVER retries a side-effecting tool without an idempotencyKey', async () => {
    const registry = createToolRegistry();
    let attempts = 0;
    registry.register(
      tool({
        name: 'payment',
        description: 'must not double-charge',
        inputSchema: z.object({}),
        sideEffectClass: 'external-stateful',
        execute: async () => {
          attempts += 1;
          throw new ToolRateLimitError('429');
        },
      }),
    );
    const executor = createToolExecutor({ registry, retry: { maxAttempts: 3, backoffMs: 1 } });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'payment', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(attempts).toBe(1);
    const outcome = completed[0]?.outcome;
    expect(outcome !== undefined && 'kind' in outcome && outcome.kind).toBe('rate_limited');
  });

  it('retries a side-effecting tool WHEN it declares an idempotencyKey', async () => {
    const registry = createToolRegistry();
    let attempts = 0;
    registry.register(
      tool({
        name: 'idempotent-post',
        description: 'safe to retry via idempotency key',
        inputSchema: z.object({}),
        sideEffectClass: 'external-stateful',
        idempotencyKey: (input: unknown) => JSON.stringify(input),
        execute: async () => {
          attempts += 1;
          if (attempts === 1) throw new ToolRateLimitError('429');
          return 'posted once';
        },
      }),
    );
    const executor = createToolExecutor({ registry, retry: { maxAttempts: 3, backoffMs: 1 } });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'idempotent-post', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(attempts).toBe(2);
    const outcome = completed[0]?.outcome;
    expect(outcome !== undefined && 'output' in outcome && outcome.output).toBe('posted once');
  });

  it('stamps the recovery envelope on every error outcome', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'typed',
        description: 'wants a number',
        inputSchema: z.object({ n: z.number() }),
        sideEffectClass: 'pure',
        execute: async () => 'ok',
      }),
    );
    const executor = createToolExecutor({ registry });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'typed', args: { n: 'x' } }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    const outcome = completed[0]?.outcome;
    if (outcome === undefined || !('kind' in outcome)) throw new Error('expected error');
    expect(outcome.kind).toBe('invalid_input');
    expect(outcome.recoverable).toBe(false);
    expect(outcome.recoveryHint).toBe('check_input');
  });
});
