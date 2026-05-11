/**
 * Coverage for `withRetry`'s `Retry-After` honouring path. The
 * middleware must prefer the hint over the computed backoff when:
 * - the thrown error carries `retryAfterMs` (already milliseconds),
 * - the thrown error carries `retryAfterSeconds` (numeric seconds),
 * - the thrown error carries `headers['retry-after']` (HTTP header).
 */
import type { Provider, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { RateLimitExceededError } from '../../src/errors/errors.js';
import { withRetry } from '../../src/middleware/with-retry.js';

interface FlakyArgs {
  failures: number;
  fail: () => unknown;
}

function flakyAdapter(args: FlakyArgs): { provider: Provider; calls: number } {
  let calls = 0;
  const state = {
    get calls() {
      return calls;
    },
  };
  const provider: Provider = {
    name: 'flaky',
    modelId: 'flaky-model',
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
      calls++;
      if (calls <= args.failures) throw args.fail();
      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
    async generate(): Promise<ProviderResponse> {
      calls++;
      if (calls <= args.failures) throw args.fail();
      return {
        text: 'ok',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
        finishReason: 'stop' as const,
      };
    },
  };
  return { provider, ...state } as { provider: Provider; calls: number };
}

const REQ = { messages: [{ role: 'user' as const, content: 'hi' }] };

describe('withRetry — Retry-After', () => {
  it('honours retryAfterMs from a RateLimitExceededError', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({
      failures: 1,
      fail: () => new RateLimitExceededError(2_500),
    });
    const wrapped = withRetry({
      maxRetries: 3,
      initialDelayMs: 100,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    await wrapped.generate(REQ);
    expect(delays).toEqual([2_500]);
  });

  it('honours retryAfterSeconds (converted to ms)', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({
      failures: 1,
      fail: () => ({ kind: 'rate-limit', retryAfterSeconds: 3 }),
    });
    const wrapped = withRetry({
      maxRetries: 3,
      initialDelayMs: 100,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    await wrapped.generate(REQ);
    expect(delays).toEqual([3_000]);
  });

  it('honours headers[retry-after] (numeric seconds form)', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({
      failures: 1,
      fail: () => ({ kind: 'rate-limit', headers: { 'retry-after': '5' } }),
    });
    const wrapped = withRetry({
      maxRetries: 3,
      initialDelayMs: 100,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    await wrapped.generate(REQ);
    expect(delays).toEqual([5_000]);
  });

  it('caps the Retry-After hint at maxDelayMs', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({
      failures: 1,
      fail: () => new RateLimitExceededError(60_000),
    });
    const wrapped = withRetry({
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 5_000,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    await wrapped.generate(REQ);
    expect(delays).toEqual([5_000]);
  });

  it('falls back to the computed backoff when no hint is present', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({
      failures: 2,
      fail: () => ({ kind: 'transient' }),
    });
    const wrapped = withRetry({
      maxRetries: 3,
      initialDelayMs: 100,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    await wrapped.generate(REQ);
    expect(delays).toEqual([100, 200]);
  });

  it('honours retryAfterMs in the streaming path too', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({
      failures: 1,
      fail: () => new RateLimitExceededError(1_500),
    });
    const wrapped = withRetry({
      maxRetries: 3,
      initialDelayMs: 100,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    let yielded = 0;
    for await (const _ of wrapped.stream(REQ)) {
      yielded++;
      void _;
    }
    expect(yielded).toBe(1);
    expect(delays).toEqual([1_500]);
  });
});
