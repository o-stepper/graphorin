/**
 * Coverage for `withRetry` — exponential backoff loop, retryable
 * predicate plumbing, abort short-circuiting, and the empty-stream
 * synthetic-finish guarantee.
 */
import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { withRetry } from '../../src/middleware/with-retry.js';

interface FlakyOptions {
  failures: number;
  fail: () => unknown;
  events?: ReadonlyArray<ProviderEvent>;
  generateResult?: ProviderResponse;
}

function flakyAdapter(opts: FlakyOptions): { provider: Provider; calls: number } {
  let calls = 0;
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
    async *stream(): AsyncIterable<ProviderEvent> {
      calls++;
      if (calls <= opts.failures) throw opts.fail();
      const events =
        opts.events ??
        ([
          { type: 'text-delta', delta: 'ok' },
          {
            type: 'finish',
            finishReason: 'stop',
            usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          },
        ] as ReadonlyArray<ProviderEvent>);
      for (const ev of events) yield ev;
    },
    async generate(): Promise<ProviderResponse> {
      calls++;
      if (calls <= opts.failures) throw opts.fail();
      return (
        opts.generateResult ?? {
          text: 'ok',
          usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          finishReason: 'stop',
        }
      );
    },
  };
  return {
    provider,
    get calls() {
      return calls;
    },
  } as { provider: Provider; calls: number };
}

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

async function collect(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('withRetry', () => {
  it('retries the configured number of times then resolves on stream()', async () => {
    const flaky = flakyAdapter({ failures: 2, fail: () => ({ kind: 'transient' }) });
    const wrapped = withRetry({
      maxRetries: 3,
      sleepImpl: () => Promise.resolve(),
      jitter: false,
    })(flaky.provider);
    const events = await collect(wrapped.stream(REQ));
    expect(events.at(-1)?.type).toBe('finish');
    expect(flaky.calls).toBe(3);
  });

  it('retries the configured number of times then resolves on generate()', async () => {
    const flaky = flakyAdapter({ failures: 2, fail: () => ({ kind: 'transient' }) });
    const wrapped = withRetry({
      maxRetries: 3,
      sleepImpl: () => Promise.resolve(),
      jitter: false,
    })(flaky.provider);
    const result = await wrapped.generate(REQ);
    expect(result.text).toBe('ok');
    expect(flaky.calls).toBe(3);
  });

  it('throws when retries are exhausted', async () => {
    const flaky = flakyAdapter({ failures: 5, fail: () => ({ kind: 'transient' }) });
    const wrapped = withRetry({
      maxRetries: 2,
      sleepImpl: () => Promise.resolve(),
      jitter: false,
    })(flaky.provider);
    await expect(wrapped.generate(REQ)).rejects.toMatchObject({ kind: 'transient' });
    expect(flaky.calls).toBe(3);
  });

  it('uses a custom retryableErrors predicate', async () => {
    const flaky = flakyAdapter({ failures: 1, fail: () => new TypeError('not retryable') });
    const wrapped = withRetry({
      maxRetries: 3,
      sleepImpl: () => Promise.resolve(),
      retryableErrors: () => false,
    })(flaky.provider);
    await expect(wrapped.generate(REQ)).rejects.toBeInstanceOf(TypeError);
    expect(flaky.calls).toBe(1);
  });

  it('AbortSignal.aborted short-circuits — error is propagated, no retries', async () => {
    const flaky = flakyAdapter({ failures: 5, fail: () => ({ kind: 'transient' }) });
    const ac = new AbortController();
    ac.abort();
    const wrapped = withRetry({
      maxRetries: 5,
      sleepImpl: () => Promise.resolve(),
    })(flaky.provider);
    await expect(wrapped.generate({ ...REQ, signal: ac.signal })).rejects.toBeDefined();
    expect(flaky.calls).toBe(1);
  });

  it('uses exponential backoff arithmetic by default', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({ failures: 3, fail: () => ({ status: 503 }) });
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
    expect(delays).toEqual([100, 200, 400]);
  });

  it('uses linear backoff when configured', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({ failures: 3, fail: () => ({ kind: 'transient' }) });
    const wrapped = withRetry({
      maxRetries: 3,
      backoff: 'linear',
      initialDelayMs: 50,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    await wrapped.generate(REQ);
    expect(delays).toEqual([50, 100, 150]);
  });

  it('uses constant backoff when configured', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({ failures: 2, fail: () => ({ kind: 'transient' }) });
    const wrapped = withRetry({
      maxRetries: 3,
      backoff: 'constant',
      initialDelayMs: 75,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    await wrapped.generate(REQ);
    expect(delays).toEqual([75, 75]);
  });

  it('caps backoff at maxDelayMs', async () => {
    const delays: number[] = [];
    const flaky = flakyAdapter({ failures: 3, fail: () => ({ kind: 'transient' }) });
    const wrapped = withRetry({
      maxRetries: 3,
      initialDelayMs: 1_000,
      maxDelayMs: 1_500,
      jitter: false,
      sleepImpl: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    })(flaky.provider);
    await wrapped.generate(REQ);
    expect(delays).toEqual([1_000, 1_500, 1_500]);
  });

  it('does not retry on non-retryable errors with the default predicate', async () => {
    const flaky = flakyAdapter({ failures: 5, fail: () => ({ kind: 'invalid-request' }) });
    const wrapped = withRetry({
      maxRetries: 3,
      sleepImpl: () => Promise.resolve(),
    })(flaky.provider);
    await expect(wrapped.generate(REQ)).rejects.toMatchObject({ kind: 'invalid-request' });
    expect(flaky.calls).toBe(1);
  });

  it('synthesises a finish event when the inner stream is empty', async () => {
    const flaky = flakyAdapter({
      failures: 0,
      fail: () => undefined,
      events: [],
    });
    const wrapped = withRetry({
      maxRetries: 1,
      sleepImpl: () => Promise.resolve(),
    })(flaky.provider);
    const events = await collect(wrapped.stream(REQ));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('finish');
  });
});
