/**
 * Unit coverage for the canonical-order middleware composer. The
 * security promise of withRedaction depends on correct ordering, so
 * every documented violation has a regression test here.
 */
import type { Provider } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { MiddlewareOrderingError } from '../../src/errors/errors.js';
import {
  CANONICAL_MIDDLEWARE_ORDER,
  composeProviderMiddleware,
  defineProviderMiddleware,
  getMiddlewareKind,
  providerHasMiddleware,
} from '../../src/middleware/compose.js';
import { withCostLimit } from '../../src/middleware/with-cost-limit.js';
import { withRateLimit } from '../../src/middleware/with-rate-limit.js';
import { withRedaction } from '../../src/middleware/with-redaction.js';
import { withRetry } from '../../src/middleware/with-retry.js';
import { withTracing } from '../../src/middleware/with-tracing.js';

function bareAdapter(): Provider {
  return {
    name: 'bare',
    modelId: 'bare-model',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 1024,
      maxOutput: 256,
    },
    async *stream() {
      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
    async generate() {
      return {
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop' as const,
      };
    },
  };
}

describe('composeProviderMiddleware', () => {
  it('exposes the canonical ordering as a constant', () => {
    expect(CANONICAL_MIDDLEWARE_ORDER).toEqual([
      'withTracing',
      'withRetry',
      'withRateLimit',
      'withCostLimit',
      'withCostTracking',
      'withFallback',
      'withRedaction',
    ]);
  });

  it('builds a chain in canonical order without throwing', () => {
    const composed = composeProviderMiddleware([
      withTracing({}),
      withRetry({ maxRetries: 1, sleepImpl: () => Promise.resolve() }),
      withRateLimit({ requestsPerMinute: 10, sleepImpl: () => Promise.resolve() }),
      withCostLimit({}),
      withRedaction({}),
    ])(bareAdapter());

    expect(getMiddlewareKind(composed)).toBe('withTracing');
    expect(providerHasMiddleware(composed, 'withRedaction')).toBe(true);
    expect(providerHasMiddleware(composed, 'withRateLimit')).toBe(true);
  });

  it('throws MiddlewareOrderingError when withTracing is not outermost', () => {
    expect(() =>
      composeProviderMiddleware([
        withRetry({ maxRetries: 1, sleepImpl: () => Promise.resolve() }),
        withTracing({}),
        withRedaction({}),
      ])(bareAdapter()),
    ).toThrow(MiddlewareOrderingError);
  });

  it('throws MiddlewareOrderingError when withRedaction is not innermost', () => {
    expect(() =>
      composeProviderMiddleware([
        withTracing({}),
        withRedaction({}),
        withRetry({ maxRetries: 1, sleepImpl: () => Promise.resolve() }),
      ])(bareAdapter()),
    ).toThrow(MiddlewareOrderingError);
  });

  it('rejects non-function entries in the array', () => {
    expect(() =>
      composeProviderMiddleware([
        withTracing({}),
        // @ts-expect-error - testing the runtime guard
        null,
      ])(bareAdapter()),
    ).toThrow(TypeError);
  });

  it('allows custom middleware at any position when registered via defineProviderMiddleware', () => {
    const withMyCustom = defineProviderMiddleware<Record<string, never>>({
      kind: 'withMyCustom',
      factory: () => (next) => ({
        ...next,
        stream: next.stream.bind(next),
        generate: next.generate.bind(next),
      }),
    });
    const composed = composeProviderMiddleware([
      withTracing({}),
      withMyCustom({}),
      withRedaction({}),
    ])(bareAdapter());
    expect(providerHasMiddleware(composed, 'withMyCustom')).toBe(true);
  });
});
