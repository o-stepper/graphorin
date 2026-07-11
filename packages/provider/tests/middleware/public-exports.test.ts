/**
 * Regression coverage for the middleware public surface (e2e 2026-07-11,
 * "listMiddlewareKinds exists in src but is not exported from dist").
 * The package barrel is the sole source of the built dist entry, so
 * asserting the re-export here pins the dist surface without needing a
 * build step inside the test run.
 */
import type { Provider } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import * as publicBarrel from '../../src/index.js';
import { listMiddlewareKinds, withRetry, withTracing } from '../../src/index.js';

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

describe('middleware public exports', () => {
  it('re-exports listMiddlewareKinds from the package barrel', () => {
    expect(typeof publicBarrel.listMiddlewareKinds).toBe('function');
  });

  it('walks a composed chain outer to inner through the public import', () => {
    const provider = withTracing({})(
      withRetry({ maxRetries: 1, sleepImpl: () => Promise.resolve() })(bareAdapter()),
    );
    expect(listMiddlewareKinds(provider)).toEqual(['withTracing', 'withRetry']);
  });
});
