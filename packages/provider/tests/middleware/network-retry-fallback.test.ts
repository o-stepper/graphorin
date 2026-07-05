/**
 * Coverage for PS-2 (network errors are retryable + fallback-eligible by
 * default) and PS-1 (withRetry never restarts a stream that already emitted
 * events). The headline scenario - a local provider that is down
 * (ECONNREFUSED) - surfaces as `ProviderHttpError{ status: 0 }`; before these
 * fixes neither default predicate accepted it, so retry/fallback never fired.
 */
import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { ProviderHttpError } from '../../src/errors/index.js';
import { withFallback } from '../../src/middleware/with-fallback.js';
import { withRetry } from '../../src/middleware/with-retry.js';

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };
const CAPS = {
  streaming: true,
  toolCalling: false,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: false,
  reasoning: false,
  contextWindow: 1024,
  maxOutput: 256,
} as const;

function networkError(cause?: unknown): ProviderHttpError {
  return new ProviderHttpError({
    providerName: 'local',
    status: 0,
    message: 'network error reaching http://127.0.0.1:11434',
    ...(cause !== undefined ? { cause } : {}),
  });
}

function serverError(status = 503): ProviderHttpError {
  return new ProviderHttpError({ providerName: 'cloud', status, message: 'service unavailable' });
}

async function collect(stream: AsyncIterable<ProviderEvent>): Promise<ProviderEvent[]> {
  const out: ProviderEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

describe('withRetry - network errors (PS-2)', () => {
  it('retries a status:0 ProviderHttpError (ECONNREFUSED-shaped) then succeeds', async () => {
    let calls = 0;
    const provider: Provider = {
      name: 'local',
      modelId: 'local-model',
      capabilities: CAPS,
      async *stream() {
        yield { type: 'finish', finishReason: 'stop', usage: zero() };
      },
      async generate() {
        calls++;
        if (calls <= 2) throw networkError(new Error('ECONNREFUSED'));
        return ok();
      },
    };
    const wrapped = withRetry({ maxRetries: 3, jitter: false, sleepImpl: () => Promise.resolve() })(
      provider,
    );
    const result = await wrapped.generate(REQ);
    expect(result.text).toBe('ok');
    expect(calls).toBe(3);
  });

  it('does NOT retry a status:0 error whose cause is an AbortError', async () => {
    let calls = 0;
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const provider: Provider = {
      name: 'local',
      modelId: 'local-model',
      capabilities: CAPS,
      async *stream() {
        yield { type: 'finish', finishReason: 'stop', usage: zero() };
      },
      async generate() {
        calls++;
        throw networkError(abort);
      },
    };
    // req.signal is NOT aborted, so the loop reaches the predicate - the
    // exclusion must come from the error's AbortError cause, not the signal.
    const wrapped = withRetry({ maxRetries: 5, jitter: false, sleepImpl: () => Promise.resolve() })(
      provider,
    );
    await expect(wrapped.generate(REQ)).rejects.toBeInstanceOf(ProviderHttpError);
    expect(calls).toBe(1);
  });
});

describe('withFallback - network errors (PS-2)', () => {
  it('falls back to the secondary when the primary throws a status:0 error', async () => {
    const primary: Provider = {
      name: 'primary',
      modelId: 'primary-model',
      capabilities: CAPS,
      async *stream() {
        yield* []; // satisfies the generator contract; this test exercises generate()
        throw networkError(new Error('ECONNREFUSED'));
      },
      async generate() {
        throw networkError(new Error('ECONNREFUSED'));
      },
    };
    const secondary: Provider = {
      name: 'secondary',
      modelId: 'secondary-model',
      capabilities: CAPS,
      async *stream() {
        yield { type: 'finish', finishReason: 'stop', usage: zero() };
      },
      async generate() {
        return ok('from-secondary');
      },
    };
    const wrapped = withFallback({ fallbacks: [secondary], logger: () => {} })(primary);
    const result = await wrapped.generate(REQ);
    expect(result.text).toBe('from-secondary');
  });
});

describe('withRetry - mid-stream failure (PS-1)', () => {
  it('does NOT restart a stream that already emitted events', async () => {
    let streamStarts = 0;
    const provider: Provider = {
      name: 'flaky-stream',
      modelId: 'flaky-stream-model',
      capabilities: CAPS,
      async *stream() {
        streamStarts++;
        yield { type: 'text-delta', delta: 'Hel' };
        yield { type: 'text-delta', delta: 'lo' };
        // A *retryable* (503) failure AFTER emitting - on the current code the
        // retry loop restarts the stream from scratch and the consumer sees
        // the two deltas twice. PS-1: once any event has been emitted the
        // error must propagate instead of restarting.
        throw serverError(503);
      },
      async generate() {
        return ok();
      },
    };
    const wrapped = withRetry({ maxRetries: 3, jitter: false, sleepImpl: () => Promise.resolve() })(
      provider,
    );
    const seen: ProviderEvent[] = [];
    await expect(
      (async () => {
        for await (const ev of wrapped.stream(REQ)) seen.push(ev);
      })(),
    ).rejects.toBeInstanceOf(ProviderHttpError);
    // The stream was attempted exactly once - no restart, no duplicates.
    expect(streamStarts).toBe(1);
    const deltas = seen.filter((e) => e.type === 'text-delta');
    expect(deltas).toHaveLength(2);
  });

  it('still retries a stream that fails BEFORE emitting any event', async () => {
    let streamStarts = 0;
    const provider: Provider = {
      name: 'pre-yield-flaky',
      modelId: 'pre-yield-flaky-model',
      capabilities: CAPS,
      async *stream() {
        streamStarts++;
        if (streamStarts <= 2) throw networkError(new Error('ECONNREFUSED'));
        yield { type: 'text-delta', delta: 'ok' };
        yield { type: 'finish', finishReason: 'stop', usage: zero() };
      },
      async generate() {
        return ok();
      },
    };
    const wrapped = withRetry({ maxRetries: 3, jitter: false, sleepImpl: () => Promise.resolve() })(
      provider,
    );
    const events = await collect(wrapped.stream(REQ));
    expect(streamStarts).toBe(3);
    expect(events.at(-1)?.type).toBe('finish');
  });
});

function zero() {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}
function ok(text = 'ok'): ProviderResponse {
  return {
    text,
    usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    finishReason: 'stop',
  };
}
