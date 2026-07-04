/**
 * `withRetry` — retry idempotent failures (5xx, network, timeouts)
 * with exponential backoff + jitter. Lives outside `withRateLimit`
 * per the canonical order so retried requests respect the rate-limit
 * bucket of the next attempt.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';

import { isAbortError } from '../internal/abort.js';
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
    const isRetryable = opts.retryableErrors ?? defaultRetryable;
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
            const hint = readRetryAfter(err);
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
  // consumer, a retryable failure mid-stream must NOT restart the stream —
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
      // Empty stream — surface a finish so callers do not hang.
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
      const hint = readRetryAfter(err);
      const delay =
        hint !== null
          ? Math.min(hint, maxDelay)
          : computeDelay(backoff, initialDelay, attempt, maxDelay, jitter);
      await sleep(delay, req.signal);
      attempt++;
    }
  }
}

/**
 * Read a `Retry-After` hint from a thrown error. Recognises:
 *
 * - `RateLimitExceededError`-shaped errors carrying a `retryAfterMs`
 *   field (already milliseconds).
 * - HTTP-shaped errors carrying a `headers['retry-after']` value
 *   (numeric seconds; we convert to milliseconds).
 * - HTTP-shaped errors carrying a `retryAfterSeconds` numeric field.
 *
 * Returns the resolved delay in milliseconds or `null` when no hint
 * is available.
 *
 * @internal
 */
function readRetryAfter(err: unknown): number | null {
  if (err === null || typeof err !== 'object') return null;
  const e = err as {
    retryAfterMs?: number;
    retryAfterSeconds?: number;
    headers?: Record<string, string | undefined>;
  };
  if (
    typeof e.retryAfterMs === 'number' &&
    Number.isFinite(e.retryAfterMs) &&
    e.retryAfterMs >= 0
  ) {
    return e.retryAfterMs;
  }
  if (
    typeof e.retryAfterSeconds === 'number' &&
    Number.isFinite(e.retryAfterSeconds) &&
    e.retryAfterSeconds >= 0
  ) {
    return Math.round(e.retryAfterSeconds * 1000);
  }
  const headerValue =
    e.headers?.['retry-after'] ?? e.headers?.['Retry-After'] ?? e.headers?.['RETRY-AFTER'];
  if (typeof headerValue === 'string' && headerValue.length > 0) {
    const seconds = Number(headerValue);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
    const httpDateMs = Date.parse(headerValue);
    if (Number.isFinite(httpDateMs)) {
      const delta = httpDateMs - Date.now();
      return delta > 0 ? delta : 0;
    }
  }
  return null;
}

function defaultRetryable(err: unknown): boolean {
  if (err === null || typeof err !== 'object') return false;
  // An aborted request is never retryable, even when it surfaces as a
  // `status: 0` network error (PS-2). The retry loop also short-circuits on
  // `req.signal?.aborted`, but the predicate must exclude abort independently
  // so an internally-aborted call is not retried.
  if (isAbortError(err)) return false;
  const e = err as { kind?: string; errorKind?: string; status?: number; name?: string };
  // `ProviderHttpError.kind` is always 'provider-http'; the canonical
  // mapped kind rides on `errorKind` — consult both.
  const kinds = [e.kind, e.errorKind];
  if (
    kinds.includes('transient') ||
    kinds.includes('rate-limit') ||
    kinds.includes('rate-limit-exceeded') ||
    kinds.includes('capacity')
  ) {
    return true;
  }
  if (
    kinds.includes('unauthorized') ||
    kinds.includes('invalid-request') ||
    kinds.includes('context-length') ||
    kinds.includes('content-filter')
  ) {
    return false;
  }
  if (typeof e.status === 'number' && e.status === 429) return true;
  if (typeof e.status === 'number' && e.status >= 500 && e.status < 600) return true;
  // PS-2: a `ProviderHttpError{ status: 0 }` is a fetch-level network failure
  // (ECONNREFUSED, DNS, connection reset) — exactly the transient class
  // `withRetry` documents. Retry it (abort already excluded above).
  if (typeof e.status === 'number' && e.status === 0) return true;
  return false;
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
