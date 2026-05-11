/**
 * `withRateLimit` — token-bucket rate limiter keyed per `provider × model`.
 * Configurable mode: `'throw'` (default) raises
 * {@link RateLimitExceededError} on overflow; `'queue'` waits for the
 * next available slot.
 *
 * @packageDocumentation
 */

import type { Provider } from '@graphorin/core';

import { RateLimitExceededError } from '../errors/errors.js';
import { defineProviderMiddleware } from './compose.js';

/**
 * Options for {@link withRateLimit}.
 *
 * @stable
 */
export interface WithRateLimitOptions {
  /** Allowed requests per minute. */
  readonly requestsPerMinute: number;
  /** Burst size — defaults to `requestsPerMinute / 4` (rounded up to >= 1). */
  readonly burst?: number;
  /** What to do on overflow. Default `'throw'`. */
  readonly mode?: 'throw' | 'queue';
  /** Test hook overriding `Date.now`. */
  readonly nowImpl?: () => number;
  /** Test hook overriding `setTimeout`-based wait. */
  readonly sleepImpl?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

interface BucketState {
  tokens: number;
  lastRefill: number;
}

/**
 * @stable
 */
export const withRateLimit = defineProviderMiddleware<WithRateLimitOptions>({
  kind: 'withRateLimit',
  factory: (opts: WithRateLimitOptions) => {
    if (!(opts.requestsPerMinute > 0)) {
      throw new RangeError('withRateLimit: requestsPerMinute must be > 0.');
    }
    const burst = Math.max(opts.burst ?? Math.ceil(opts.requestsPerMinute / 4), 1);
    const refillPerMs = opts.requestsPerMinute / 60_000;
    const mode = opts.mode ?? 'throw';
    const now = opts.nowImpl ?? (() => Date.now());
    const sleep = opts.sleepImpl ?? defaultSleep;
    const buckets = new Map<string, BucketState>();
    return (next: Provider): Provider => {
      const key = `${next.name}::${next.modelId}`;
      const acquire = async (signal?: AbortSignal): Promise<void> => {
        const bucket = buckets.get(key) ?? { tokens: burst, lastRefill: now() };
        const ts = now();
        const elapsed = ts - bucket.lastRefill;
        bucket.tokens = Math.min(burst, bucket.tokens + elapsed * refillPerMs);
        bucket.lastRefill = ts;
        if (bucket.tokens >= 1) {
          bucket.tokens -= 1;
          buckets.set(key, bucket);
          return;
        }
        const waitMs = Math.ceil((1 - bucket.tokens) / refillPerMs);
        if (mode === 'throw') {
          buckets.set(key, bucket);
          throw new RateLimitExceededError(waitMs);
        }
        await sleep(waitMs, signal);
        bucket.tokens = 0;
        bucket.lastRefill = now();
        buckets.set(key, bucket);
      };
      return {
        name: next.name,
        modelId: next.modelId,
        capabilities: next.capabilities,
        ...(next.acceptsSensitivity !== undefined
          ? { acceptsSensitivity: next.acceptsSensitivity }
          : {}),
        stream(req) {
          return rateLimitedStream(next, req, acquire);
        },
        async generate(req) {
          await acquire(req.signal);
          return next.generate(req);
        },
        ...(next.countTokens ? { countTokens: next.countTokens.bind(next) } : {}),
      };
    };
  },
});

async function* rateLimitedStream(
  next: Provider,
  req: import('@graphorin/core').ProviderRequest,
  acquire: (signal?: AbortSignal) => Promise<void>,
): AsyncIterable<import('@graphorin/core').ProviderEvent> {
  await acquire(req.signal);
  for await (const event of next.stream(req)) {
    yield event;
  }
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('aborted'));
      return;
    }
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      cleanup();
      reject(signal?.reason ?? new Error('aborted'));
    };
    function cleanup(): void {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
