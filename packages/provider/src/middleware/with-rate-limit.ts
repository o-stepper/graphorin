/**
 * `withRateLimit` - token-bucket rate limiter keyed per `provider × model`.
 * Configurable mode: `'throw'` (default) raises
 * {@link RateLimitExceededError} on overflow; `'queue'` waits for the
 * next available slot.
 *
 * An optional second dimension, `tokensPerMinute`, budgets
 * MODEL tokens alongside requests. For agentic workloads the binding
 * provider limit is TPM, not RPM - a 150k-token compacted transcript
 * used to occupy the same single slot as a 200-token reranker call,
 * so bursts of long-context steps sailed through the RPM gate and
 * surfaced as provider 429s that only `withRetry` absorbed.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest } from '@graphorin/core';

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
  /** Burst size - defaults to `requestsPerMinute / 4` (rounded up to >= 1). */
  readonly burst?: number;
  /**
   * Optional token budget per minute. When set, each request
   * additionally reserves its estimated token weight from a second
   * bucket whose capacity is the full minute budget; a request whose
   * weight exceeds the remaining budget waits (queue mode) or throws
   * with the TPM-aware `retryAfterMs` (throw mode) even when the RPM
   * bucket has room. Unset: behaviour is byte-identical to the
   * RPM-only limiter.
   */
  readonly tokensPerMinute?: number;
  /**
   * Estimator for a request's token weight (only consulted when
   * `tokensPerMinute` is set). The default is the deliberate cheap
   * heuristic `ceil(textChars / 4) + (maxTokens ?? 0)` - synchronous
   * and allocation-free, because this runs in the request hot path and
   * must not add latency or network. Wire the counter from
   * `@graphorin/provider/counters` (`createDefaultCounter`) here when
   * you need provider-accurate weights.
   */
  readonly estimateTokens?: (req: ProviderRequest) => number;
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
  /** TPM weight this waiter must reserve (0 when TPM is unset). */
  weight: number;
}

interface BucketState {
  tokens: number;
  lastRefill: number;
  /** Remaining TPM budget (only meaningful when TPM is set). */
  tpmTokens: number;
  tpmLastRefill: number;
  /** FIFO waiters in `'queue'` mode. */
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
    if (opts.tokensPerMinute !== undefined && !(opts.tokensPerMinute > 0)) {
      throw new RangeError('withRateLimit: tokensPerMinute must be > 0 when set.');
    }
    const burst = Math.max(opts.burst ?? Math.ceil(opts.requestsPerMinute / 4), 1);
    const refillPerMs = opts.requestsPerMinute / 60_000;
    const tpm = opts.tokensPerMinute;
    const tpmRefillPerMs = tpm === undefined ? 0 : tpm / 60_000;
    const estimate = opts.estimateTokens ?? estimateTokensHeuristic;
    const mode = opts.mode ?? 'throw';
    const now = opts.nowImpl ?? (() => Date.now());
    const sleep = opts.sleepImpl ?? defaultSleep;
    const buckets = new Map<string, BucketState>();
    return (next: Provider): Provider => {
      const key = `${next.name}::${next.modelId}`;
      const bucketFor = (): BucketState => {
        let bucket = buckets.get(key);
        if (bucket === undefined) {
          bucket = {
            tokens: burst,
            lastRefill: now(),
            tpmTokens: tpm ?? 0,
            tpmLastRefill: now(),
            queue: [],
            draining: false,
          };
          buckets.set(key, bucket);
        }
        return bucket;
      };
      const refill = (bucket: BucketState): void => {
        const ts = now();
        bucket.tokens = Math.min(burst, bucket.tokens + (ts - bucket.lastRefill) * refillPerMs);
        bucket.lastRefill = ts;
        if (tpm !== undefined) {
          // TPM bucket capacity = the full minute budget, so any
          // (clamped) weight is eventually satisfiable.
          bucket.tpmTokens = Math.min(
            tpm,
            bucket.tpmTokens + (ts - bucket.tpmLastRefill) * tpmRefillPerMs,
          );
          bucket.tpmLastRefill = ts;
        }
      };
      /**
       * A request's TPM weight, clamped to the bucket capacity - a
       * single request estimated above the whole minute budget must
       * degrade to "wait for a full bucket", not deadlock the queue
       * forever behind an unsatisfiable reservation.
       */
      const weightFor = (req: ProviderRequest): number => {
        if (tpm === undefined) return 0;
        const raw = estimate(req);
        return Math.min(Math.max(0, Number.isFinite(raw) ? raw : tpm), tpm);
      };
      /** Both dimensions available for this weight? */
      const available = (bucket: BucketState, weight: number): boolean =>
        bucket.tokens >= 1 && (tpm === undefined || bucket.tpmTokens >= weight);
      /** Wait until BOTH dimensions can serve `weight`, in ms. */
      const waitMsFor = (bucket: BucketState, weight: number): number => {
        const reqWait = bucket.tokens >= 1 ? 0 : (1 - bucket.tokens) / refillPerMs;
        const tpmWait =
          tpm === undefined || bucket.tpmTokens >= weight
            ? 0
            : (weight - bucket.tpmTokens) / tpmRefillPerMs;
        return Math.ceil(Math.max(reqWait, tpmWait));
      };
      /** Deduct BOTH dimensions atomically (caller checked `available`). */
      const take = (bucket: BucketState, weight: number): void => {
        bucket.tokens -= 1;
        if (tpm !== undefined) bucket.tpmTokens -= weight;
      };
      // PS-18: a single drain loop per bucket grants queued waiters ONE slot at
      // a time, sleeping until the next token actually refills. Previously every
      // concurrent waiter computed the same wait, slept once, and then all
      // passed - letting N requests through on ~1 token (a burst). FIFO order is
      // preserved and grants track the real refill schedule. W-145: a grant now
      // requires BOTH the request token and the head's TPM weight.
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
            if (available(bucket, head.weight)) {
              take(bucket, head.weight);
              bucket.queue.shift();
              head.resolve();
              continue;
            }
            const waitMs = waitMsFor(bucket, head.weight);
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
      const acquire = async (signal?: AbortSignal, weight = 0): Promise<void> => {
        if (signal?.aborted === true) throw signal.reason ?? new Error('aborted');
        const bucket = bucketFor();
        refill(bucket);
        // Fast path: both dimensions free AND nobody queued ahead (FIFO).
        if (available(bucket, weight) && bucket.queue.length === 0) {
          take(bucket, weight);
          return;
        }
        if (mode === 'throw') {
          throw new RateLimitExceededError(waitMsFor(bucket, weight));
        }
        await new Promise<void>((resolve, reject) => {
          const waiter: Waiter = {
            resolve,
            reject,
            ...(signal ? { signal } : {}),
            cancelled: false,
            weight,
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
          return rateLimitedStream(next, req, acquire, weightFor(req));
        },
        async generate(req) {
          await acquire(req.signal, weightFor(req));
          return next.generate(req);
        },
        ...(next.countTokens ? { countTokens: next.countTokens.bind(next) } : {}),
      };
    };
  },
});

/**
 * Default TPM weight heuristic: `ceil(textChars / 4) + (maxTokens ?? 0)`.
 * Counts string contents and the `text` of content parts plus the
 * system message; images / other parts are not weighed (heuristic by
 * design - see {@link WithRateLimitOptions.estimateTokens}).
 */
function estimateTokensHeuristic(req: ProviderRequest): number {
  let chars = req.systemMessage?.length ?? 0;
  for (const message of req.messages) {
    const content: unknown = message.content;
    if (typeof content === 'string') {
      chars += content.length;
    } else if (Array.isArray(content)) {
      for (const part of content) {
        const text = (part as { readonly text?: unknown }).text;
        if (typeof text === 'string') chars += text.length;
      }
    }
  }
  return Math.ceil(chars / 4) + (req.maxTokens ?? 0);
}

async function* rateLimitedStream(
  next: Provider,
  req: import('@graphorin/core').ProviderRequest,
  acquire: (signal?: AbortSignal, weight?: number) => Promise<void>,
  weight: number,
): AsyncIterable<import('@graphorin/core').ProviderEvent> {
  await acquire(req.signal, weight);
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
