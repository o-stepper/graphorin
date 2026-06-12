/**
 * Coverage for `withRateLimit` — bucket exhaustion, queue mode wait
 * arithmetic, and refill timing via injected `nowImpl` / `sleepImpl`.
 */
import type { Provider, ProviderEvent, ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { RateLimitExceededError } from '../../src/errors/errors.js';
import { withRateLimit } from '../../src/middleware/with-rate-limit.js';

function quietProvider(): Provider {
  return {
    name: 'quiet',
    modelId: 'q',
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
    async *stream(): AsyncIterable<ProviderEvent> {
      yield {
        type: 'finish',
        finishReason: 'stop',
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

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

async function consume(stream: AsyncIterable<ProviderEvent>): Promise<void> {
  for await (const _ of stream) void _;
}

describe('withRateLimit — option validation', () => {
  it('throws when requestsPerMinute is not positive', () => {
    expect(() => withRateLimit({ requestsPerMinute: 0 })(quietProvider())).toThrow(RangeError);
    expect(() => withRateLimit({ requestsPerMinute: -1 })(quietProvider())).toThrow(RangeError);
  });
});

describe('withRateLimit — throw mode', () => {
  it('raises RateLimitExceededError once the bucket is exhausted', async () => {
    const now = 1_000_000;
    const wrapped = withRateLimit({
      requestsPerMinute: 60,
      burst: 2,
      nowImpl: () => now,
    })(quietProvider());
    await wrapped.generate(REQ);
    await wrapped.generate(REQ);
    await expect(wrapped.generate(REQ)).rejects.toBeInstanceOf(RateLimitExceededError);
  });

  it('refills the bucket as time advances', async () => {
    let now = 0;
    const wrapped = withRateLimit({
      requestsPerMinute: 60, // 1 token / 1000ms
      burst: 1,
      nowImpl: () => now,
    })(quietProvider());
    await wrapped.generate(REQ);
    await expect(wrapped.generate(REQ)).rejects.toBeInstanceOf(RateLimitExceededError);
    now = 2_000;
    await expect(wrapped.generate(REQ)).resolves.toBeDefined();
  });

  it('exposes retryAfterMs on the thrown error', async () => {
    const now = 0;
    const wrapped = withRateLimit({
      requestsPerMinute: 60, // 1 token per 1000ms
      burst: 1,
      nowImpl: () => now,
    })(quietProvider());
    await wrapped.generate(REQ);
    try {
      await wrapped.generate(REQ);
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitExceededError);
      expect((err as RateLimitExceededError).retryAfterMs).toBeGreaterThan(0);
    }
  });
});

describe('withRateLimit — queue mode', () => {
  it('waits via injected sleepImpl when the bucket is empty', async () => {
    const sleeps: number[] = [];
    let now = 0;
    const wrapped = withRateLimit({
      requestsPerMinute: 60,
      burst: 1,
      mode: 'queue',
      nowImpl: () => now,
      sleepImpl: (ms) => {
        sleeps.push(ms);
        now += ms;
        return Promise.resolve();
      },
    })(quietProvider());
    await wrapped.generate(REQ);
    await wrapped.generate(REQ);
    expect(sleeps.length).toBe(1);
    expect(sleeps[0]).toBeGreaterThan(0);
  });

  it('grants concurrent waiters one per refill interval, not in a burst (PS-18)', async () => {
    // A controllable clock: sleeps resolve only when the clock is advanced past
    // their wake time, so genuinely-concurrent waiters can be distinguished from
    // serialized ones (a synchronous fake clock cannot).
    let now = 0;
    const pending: Array<{ wake: number; resolve: () => void }> = [];
    const sleepImpl = (ms: number): Promise<void> =>
      new Promise<void>((resolve) => {
        pending.push({ wake: now + ms, resolve });
      });
    async function advanceTo(t: number): Promise<void> {
      now = t;
      // Resolve due sleeps and keep flushing microtasks so the drainer's grant
      // chain (sleep → grant → acquire resolve → generate → .then) fully settles.
      for (let round = 0; round < 30; round++) {
        for (const p of pending.filter((q) => q.wake <= now)) {
          pending.splice(pending.indexOf(p), 1);
          p.resolve();
        }
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      }
    }

    const granted: number[] = [];
    const wrapped = withRateLimit({
      requestsPerMinute: 60, // 1 token / 1000ms
      burst: 1,
      mode: 'queue',
      nowImpl: () => now,
      sleepImpl,
    })(quietProvider());

    // Drain the single burst token, then fire three concurrent waiters.
    await wrapped.generate(REQ);
    for (let i = 0; i < 3; i++) void wrapped.generate(REQ).then(() => granted.push(now));
    await Promise.resolve();
    await Promise.resolve();
    expect(granted.length).toBe(0); // nothing granted before the clock advances

    await advanceTo(1000);
    expect(granted.length).toBe(1); // ONE per interval — not a burst of 3
    await advanceTo(2000);
    expect(granted.length).toBe(2);
    await advanceTo(3000);
    expect(granted.length).toBe(3);
  });
});

describe('withRateLimit — stream surface', () => {
  it('acquires a token before yielding stream events', async () => {
    const now = 0;
    const wrapped = withRateLimit({
      requestsPerMinute: 60,
      burst: 1,
      nowImpl: () => now,
    })(quietProvider());
    await consume(wrapped.stream(REQ));
    await expect(consume(wrapped.stream(REQ))).rejects.toBeInstanceOf(RateLimitExceededError);
  });
});
