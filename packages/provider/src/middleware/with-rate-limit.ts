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

interface Waiter {
  resolve: () => void;
  reject: (err: unknown) => void;
  signal?: AbortSignal;
  cancelled: boolean;
}

interface BucketState {
  tokens: number;
  lastRefill: number;
  /** FIFO waiters in `'queue'` mode (PS-18). */
  queue: Waiter[];
  /** Whether the single drain loop for this bucket is running. */
  draining: boolean;
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
      const bucketFor = (): BucketState => {
        let bucket = buckets.get(key);
        if (bucket === undefined) {
          bucket = { tokens: burst, lastRefill: now(), queue: [], draining: false };
          buckets.set(key, bucket);
        }
        return bucket;
      };
      const refill = (bucket: BucketState): void => {
        const ts = now();
        bucket.tokens = Math.min(burst, bucket.tokens + (ts - bucket.lastRefill) * refillPerMs);
        bucket.lastRefill = ts;
      };
      // PS-18: a single drain loop per bucket grants queued waiters ONE token at
      // a time, sleeping until the next token actually refills. Previously every
      // concurrent waiter computed the same wait, slept once, and then all
      // passed — letting N requests through on ~1 token (a burst). FIFO order is
      // preserved and grants track the real refill schedule.
      const drain = (bucket: BucketState): void => {
        if (bucket.draining) return;
        bucket.draining = true;
        void (async () => {
          while (bucket.queue.length > 0) {
            const head = bucket.queue[0];
            if (head === undefined) break;
            if (head.cancelled) {
              bucket.queue.shift();
              continue;
            }
            refill(bucket);
            if (bucket.tokens >= 1) {
              bucket.tokens -= 1;
              bucket.queue.shift();
              head.resolve();
              continue;
            }
            const waitMs = Math.ceil((1 - bucket.tokens) / refillPerMs);
            try {
              await sleep(waitMs);
            } catch {
              // The shared drain sleep carries no per-waiter signal; individual
              // aborts are handled on the waiter via its listener.
            }
          }
          bucket.draining = false;
        })();
      };
      const acquire = async (signal?: AbortSignal): Promise<void> => {
        if (signal?.aborted === true) throw signal.reason ?? new Error('aborted');
        const bucket = bucketFor();
        refill(bucket);
        // Fast path: a token is free AND nobody is queued ahead (preserve FIFO).
        if (bucket.tokens >= 1 && bucket.queue.length === 0) {
          bucket.tokens -= 1;
          return;
        }
        if (mode === 'throw') {
          throw new RateLimitExceededError(Math.ceil((1 - bucket.tokens) / refillPerMs));
        }
        await new Promise<void>((resolve, reject) => {
          const waiter: Waiter = {
            resolve,
            reject,
            ...(signal ? { signal } : {}),
            cancelled: false,
          };
          if (signal !== undefined) {
            const onAbort = (): void => {
              waiter.cancelled = true;
              reject(signal.reason ?? new Error('aborted'));
            };
            signal.addEventListener('abort', onAbort, { once: true });
            const settle = resolve;
            waiter.resolve = (): void => {
              signal.removeEventListener('abort', onAbort);
              settle();
            };
          }
          bucket.queue.push(waiter);
          drain(bucket);
        });
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
