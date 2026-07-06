/**
 * Coverage for `withRateLimit` - bucket exhaustion, queue mode wait
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

describe('withRateLimit - option validation', () => {
  it('throws when requestsPerMinute is not positive', () => {
    expect(() => withRateLimit({ requestsPerMinute: 0 })(quietProvider())).toThrow(RangeError);
    expect(() => withRateLimit({ requestsPerMinute: -1 })(quietProvider())).toThrow(RangeError);
  });
});

describe('withRateLimit - throw mode', () => {
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

describe('withRateLimit - queue mode', () => {
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
    expect(granted.length).toBe(1); // ONE per interval - not a burst of 3
    await advanceTo(2000);
    expect(granted.length).toBe(2);
    await advanceTo(3000);
    expect(granted.length).toBe(3);
  });
});

describe('withRateLimit - stream surface', () => {
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

// W-145: the optional tokensPerMinute dimension. The binding provider
// limit for agentic workloads is TPM: a 150k-token compacted
// transcript must not ride the same single RPM slot as a 200-token
// reranker call.
describe('withRateLimit - tokensPerMinute (W-145)', () => {
  const bigReq = (chars: number, maxTokens = 0): ProviderRequest => ({
    messages: [{ role: 'user', content: 'x'.repeat(chars) }],
    ...(maxTokens > 0 ? { maxTokens } : {}),
  });

  it('option validation: tokensPerMinute must be positive when set', () => {
    expect(() =>
      withRateLimit({ requestsPerMinute: 60, tokensPerMinute: 0 })(quietProvider()),
    ).toThrow(RangeError);
  });

  it('throw mode: a request over the remaining TPM budget throws with a TPM-aware retryAfterMs even when RPM is free', async () => {
    const now = 0;
    const wrapped = withRateLimit({
      requestsPerMinute: 600, // plenty of RPM
      burst: 100,
      tokensPerMinute: 600, // 10 tokens / 1000ms
      nowImpl: () => now,
    })(quietProvider());
    // First call drains 400 of the 600-token budget (1600 chars / 4).
    await wrapped.generate(bigReq(1600));
    // Second call wants 400 again; only 200 remain -> needs 200 tokens
    // = 20_000ms at 10 tokens/s, despite ~99 free RPM slots.
    try {
      await wrapped.generate(bigReq(1600));
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitExceededError);
      expect((err as RateLimitExceededError).retryAfterMs).toBe(20_000);
    }
  });

  it('queue mode: the second request waits exactly for the missing TPM tokens, FIFO preserved', async () => {
    const sleeps: number[] = [];
    let now = 0;
    const wrapped = withRateLimit({
      requestsPerMinute: 600,
      burst: 100,
      tokensPerMinute: 600, // 10 tokens / 1000ms
      mode: 'queue',
      nowImpl: () => now,
      sleepImpl: (ms) => {
        sleeps.push(ms);
        now += ms;
        return Promise.resolve();
      },
    })(quietProvider());
    const order: number[] = [];
    await wrapped.generate(bigReq(1600)); // takes 400 of 600
    const second = wrapped.generate(bigReq(1600)).then(() => order.push(2));
    const third = wrapped.generate(bigReq(4)).then(() => order.push(3));
    await Promise.all([second, third]);
    // The 400-weight head waited for its missing 200 tokens; the light
    // request queued BEHIND it (FIFO), not around it.
    expect(sleeps.length).toBeGreaterThan(0);
    expect(sleeps[0]).toBe(20_000);
    expect(order).toEqual([2, 3]);
  });

  it('uses a custom estimateTokens instead of the heuristic', async () => {
    const seen: number[] = [];
    const wrapped = withRateLimit({
      requestsPerMinute: 600,
      burst: 100,
      tokensPerMinute: 1000,
      estimateTokens: (req) => {
        const weight = 999;
        seen.push(weight);
        void req;
        return weight;
      },
      nowImpl: () => 0,
    })(quietProvider());
    await wrapped.generate(REQ);
    expect(seen).toEqual([999]);
    // 999 of 1000 spent: the next 999-weight call cannot fit.
    await expect(wrapped.generate(REQ)).rejects.toBeInstanceOf(RateLimitExceededError);
  });

  it('clamps a weight above the minute budget instead of deadlocking the queue', async () => {
    const sleeps: number[] = [];
    let now = 0;
    const wrapped = withRateLimit({
      requestsPerMinute: 600,
      burst: 100,
      tokensPerMinute: 100, // tiny budget
      mode: 'queue',
      nowImpl: () => now,
      sleepImpl: (ms) => {
        sleeps.push(ms);
        now += ms;
        return Promise.resolve();
      },
    })(quietProvider());
    // Estimated weight 2500 (10_000 chars / 4) >> 100 budget: clamped
    // to 100, so it resolves after waiting for a full bucket at most.
    await wrapped.generate(bigReq(400)); // drains the 100 budget
    await expect(wrapped.generate(bigReq(10_000))).resolves.toBeDefined();
    expect(sleeps.length).toBeGreaterThan(0);
  });

  it('the maxTokens reservation counts into the weight', async () => {
    const wrapped = withRateLimit({
      requestsPerMinute: 600,
      burst: 100,
      tokensPerMinute: 600,
      nowImpl: () => 0,
    })(quietProvider());
    // 4 chars -> 1 token, plus maxTokens 599 -> weight 600 == budget.
    await wrapped.generate(bigReq(4, 599));
    await expect(wrapped.generate(bigReq(4))).rejects.toBeInstanceOf(RateLimitExceededError);
  });
});
