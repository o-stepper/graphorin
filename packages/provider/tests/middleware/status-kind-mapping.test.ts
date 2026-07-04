/**
 * core-provider-05: HTTP status → ProviderErrorKind mapping, backoff
 * header capture, and the 429-fallback path.
 *
 * Pre-fix: `defaultShouldFallback` checked `e.kind === 'rate-limit'`
 * but nothing ever threw that kind (429s surface as
 * `ProviderHttpError{kind:'provider-http'}`), so a rate-limited
 * primary never failed over; `callJsonHttp` also discarded response
 * headers, so Retry-After hints were dead code for HTTP adapters.
 */
import type { Provider } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { classifyHttpStatus, ProviderHttpError } from '../../src/errors/errors.js';
import { callJsonHttp } from '../../src/internal/http.js';
import { withFallback } from '../../src/middleware/with-fallback.js';
import { withRetry } from '../../src/middleware/with-retry.js';

describe('classifyHttpStatus', () => {
  it('maps the canonical statuses', () => {
    expect(classifyHttpStatus(429)).toBe('rate-limit');
    expect(classifyHttpStatus(401)).toBe('unauthorized');
    expect(classifyHttpStatus(403)).toBe('unauthorized');
    expect(classifyHttpStatus(400)).toBe('invalid-request');
    expect(classifyHttpStatus(404)).toBe('invalid-request');
    expect(classifyHttpStatus(422)).toBe('invalid-request');
    expect(classifyHttpStatus(503)).toBe('capacity');
    expect(classifyHttpStatus(529)).toBe('capacity');
    expect(classifyHttpStatus(500)).toBe('transient');
    expect(classifyHttpStatus(502)).toBe('transient');
    expect(classifyHttpStatus(0)).toBe('transient');
    expect(classifyHttpStatus(418)).toBe('unknown');
  });

  it('sniffs context-length overflows out of 400 bodies', () => {
    expect(classifyHttpStatus(400, "This model's maximum context length is 8192 tokens")).toBe(
      'context-length',
    );
    expect(classifyHttpStatus(400, 'prompt is too long: 210011 tokens > 200000 maximum')).toBe(
      'context-length',
    );
    expect(classifyHttpStatus(400, 'missing required field: model')).toBe('invalid-request');
  });
});

describe('ProviderHttpError.errorKind', () => {
  it('is derived from the status + message', () => {
    const rateLimited = new ProviderHttpError({ providerName: 'p', status: 429, message: 'slow' });
    expect(rateLimited.kind).toBe('provider-http'); // stable discriminant untouched
    expect(rateLimited.errorKind).toBe('rate-limit');
    const overflow = new ProviderHttpError({
      providerName: 'p',
      status: 400,
      message: 'prompt is too long: 300000 tokens',
    });
    expect(overflow.errorKind).toBe('context-length');
  });
});

describe('callJsonHttp header capture', () => {
  it('attaches retry-after and x-ratelimit-* headers to the thrown error', async () => {
    const fetchImpl = (async () =>
      new Response('rate limited', {
        status: 429,
        headers: {
          'Retry-After': '7',
          'X-RateLimit-Remaining': '0',
          'x-unrelated': 'dropped',
        },
      })) as unknown as typeof fetch;
    const err = await callJsonHttp({
      providerName: 'p',
      url: 'http://127.0.0.1:9/v1/chat/completions',
      headers: {},
      body: {},
      fetchImpl,
    }).catch((e: unknown) => e as ProviderHttpError);
    expect(err).toBeInstanceOf(ProviderHttpError);
    const httpErr = err as ProviderHttpError;
    expect(httpErr.status).toBe(429);
    expect(httpErr.errorKind).toBe('rate-limit');
    expect(httpErr.headers?.['retry-after']).toBe('7');
    expect(httpErr.headers?.['x-ratelimit-remaining']).toBe('0');
    expect(httpErr.headers?.['x-unrelated']).toBeUndefined();
  });
});

function providerOf(args: { name: string; generate: Provider['generate'] }): Provider {
  return {
    name: args.name,
    modelId: 'm',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 8192,
      maxOutput: 4096,
      reasoningContract: 'optional',
    },
    async *stream() {
      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
    generate: args.generate,
  };
}

describe('withFallback on rate limits', () => {
  const silent = () => {};

  it('a 429 ProviderHttpError on the primary fails over to the fallback', async () => {
    const primary = providerOf({
      name: 'primary',
      generate: async () => {
        throw new ProviderHttpError({ providerName: 'primary', status: 429, message: 'slow' });
      },
    });
    const fallback = providerOf({
      name: 'fallback',
      generate: async () => ({
        text: 'served-by-fallback',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
        finishReason: 'stop' as const,
      }),
    });
    const chained = withFallback({ fallbacks: [fallback], logger: silent })(primary);
    const result = await chained.generate({ messages: [] });
    expect(result.text).toBe('served-by-fallback');
  });

  it('a context-length 400 never fails over (deterministic request problem)', async () => {
    let fallbackCalled = false;
    const primary = providerOf({
      name: 'primary',
      generate: async () => {
        throw new ProviderHttpError({
          providerName: 'primary',
          status: 400,
          message: 'prompt is too long: 300000 tokens > 200000 maximum',
        });
      },
    });
    const fallback = providerOf({
      name: 'fallback',
      generate: async () => {
        fallbackCalled = true;
        return {
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop' as const,
        };
      },
    });
    const chained = withFallback({ fallbacks: [fallback], logger: silent })(primary);
    await expect(chained.generate({ messages: [] })).rejects.toThrow(ProviderHttpError);
    expect(fallbackCalled).toBe(false);
  });
});

describe('withRetry honours captured Retry-After headers', () => {
  it('sleeps the server-provided delay for a header-carrying 429', async () => {
    const delays: number[] = [];
    let attempts = 0;
    const provider = providerOf({
      name: 'p',
      generate: async () => {
        attempts++;
        if (attempts === 1) {
          throw new ProviderHttpError({
            providerName: 'p',
            status: 429,
            message: 'slow',
            headers: { 'retry-after': '2' },
          });
        }
        return {
          text: 'ok',
          usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          finishReason: 'stop' as const,
        };
      },
    });
    const retried = withRetry({
      maxRetries: 2,
      sleepImpl: async (ms) => {
        delays.push(ms);
      },
    })(provider);
    const result = await retried.generate({ messages: [] });
    expect(result.text).toBe('ok');
    expect(delays).toEqual([2000]);
  });
});
