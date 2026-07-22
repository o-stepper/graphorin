/**
 * `withRetry` - retry idempotent failures (5xx, network, timeouts)
 * with exponential backoff + jitter. Lives outside `withRateLimit`
 * per the canonical order so retried requests respect the rate-limit
 * bucket of the next attempt.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';

import { isRetryableProviderFailure, readRetryAfterMs } from '../errors/retryability.js';
import { defineProviderMiddleware } from './compose.js';

/**
 * Options for {@link withRetry}.
 *
 * @stable
 */
export interface WithRetryOptions {
  readonly maxRetries?: number;
  readonly backoff?: 'exponential' | 'linear' | 'constant';
  readonly initialDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly jitter?: boolean;
  readonly retryableErrors?: (err: unknown) => boolean;
  /** Optional sleep override (test fixtures use a synchronous resolver). */
  readonly sleepImpl?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

/**
 * @stable
 */
export const withRetry = defineProviderMiddleware<WithRetryOptions>({
  kind: 'withRetry',
  factory: (opts: WithRetryOptions) => {
    const maxRetries = opts.maxRetries ?? 3;
    const backoff = opts.backoff ?? 'exponential';
    const initialDelay = opts.initialDelayMs ?? 250;
    const maxDelay = opts.maxDelayMs ?? 30_000;
    const jitter = opts.jitter ?? true;
    const isRetryable = opts.retryableErrors ?? isRetryableProviderFailure;
    const sleep = opts.sleepImpl ?? defaultSleep;
    return (next: Provider): Provider => ({
      name: next.name,
      modelId: next.modelId,
      capabilities: next.capabilities,
      ...(next.acceptsSensitivity !== undefined
        ? { acceptsSensitivity: next.acceptsSensitivity }
        : {}),
      stream(req) {
        return retryingStream(
          next,
          req,
          maxRetries,
          backoff,
          initialDelay,
          maxDelay,
          jitter,
          isRetryable,
          sleep,
        );
      },
      async generate(req) {
        let attempt = 0;
        for (;;) {
          try {
            return await next.generate(req);
          } catch (err) {
            if (req.signal?.aborted) throw err;
            if (attempt >= maxRetries) throw err;
            if (!isRetryable(err)) throw err;
            const hint = readRetryAfterMs(err);
            const delay =
              hint !== null
                ? Math.min(hint, maxDelay)
                : computeDelay(backoff, initialDelay, attempt, maxDelay, jitter);
            await sleep(delay, req.signal);
            attempt++;
          }
        }
      },
      ...(next.countTokens ? { countTokens: next.countTokens.bind(next) } : {}),
    });
  },
});

async function* retryingStream(
  next: Provider,
  req: ProviderRequest,
  maxRetries: number,
  backoff: 'exponential' | 'linear' | 'constant',
  initialDelay: number,
  maxDelay: number,
  jitter: boolean,
  isRetryable: (err: unknown) => boolean,
  sleep: (ms: number, signal?: AbortSignal) => Promise<void>,
): AsyncIterable<ProviderEvent> {
  let attempt = 0;
  // Stream-level (not per-attempt): once *any* event has reached the
  // consumer, a retryable failure mid-stream must NOT restart the stream -
  // that would replay stream-start + already-delivered text/tool-call events
  // into the same iteration (duplicate output, potential double tool execution).
  // `withFallback` upholds the same invariant. Pre-yield failures still retry.
  let yieldedAny = false;
  for (;;) {
    try {
      for await (const event of next.stream(req)) {
        yieldedAny = true;
        yield event;
      }
      if (yieldedAny) return;
      // Empty stream - surface a finish so callers do not hang.
      yield {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
      return;
    } catch (err) {
      if (req.signal?.aborted) throw err;
      // PS-1: never restart a stream that already emitted events.
      if (yieldedAny) throw err;
      if (attempt >= maxRetries) throw err;
      if (!isRetryable(err)) throw err;
      const hint = readRetryAfterMs(err);
      const delay =
        hint !== null
          ? Math.min(hint, maxDelay)
          : computeDelay(backoff, initialDelay, attempt, maxDelay, jitter);
      await sleep(delay, req.signal);
      attempt++;
    }
  }
}

function computeDelay(
  backoff: 'exponential' | 'linear' | 'constant',
  initial: number,
  attempt: number,
  maxDelay: number,
  jitter: boolean,
): number {
  let delay: number;
  switch (backoff) {
    case 'exponential':
      delay = initial * 2 ** attempt;
      break;
    case 'linear':
      delay = initial * (attempt + 1);
      break;
    default:
      delay = initial;
      break;
  }
  delay = Math.min(delay, maxDelay);
  if (jitter) {
    const factor = 0.5 + Math.random() * 0.5; // 0.5..1.0
    delay = Math.floor(delay * factor);
  }
  return delay;
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

// Cast for return-type compatibility with the discriminated union in
// `Provider.generate(...)` (TypeScript has no concept of "exhaustive
// retry loop" so the empty exit path is unreachable).
export type _RetryProviderResponseGuard = ProviderResponse;
