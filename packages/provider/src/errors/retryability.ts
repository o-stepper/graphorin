/**
 * Shared transient-failure classification for provider errors.
 *
 * `withRetry` and `withFallback` used to carry two hand-maintained
 * copies of the same predicate; both now delegate here so the
 * retry/fallback eligibility of an error can never drift between the
 * two middleware. Consumers building their own recovery loops (agent
 * step fallback, queue re-enqueue) can import the same predicate and
 * inherit every future refinement.
 *
 * @packageDocumentation
 */

import { isAbortError } from '../internal/abort.js';

/**
 * Canonical error kinds that indicate a transient condition worth
 * retrying or failing over: the next attempt (or the next provider)
 * has a real chance of succeeding.
 */
const TRANSIENT_KINDS: ReadonlySet<string> = new Set([
  'transient',
  'rate-limit',
  'rate-limit-exceeded',
  'capacity',
]);

/**
 * Canonical error kinds that are terminal for the request as sent:
 * repeating the identical request cannot succeed, so neither retry
 * nor fallback applies.
 */
const TERMINAL_KINDS: ReadonlySet<string> = new Set([
  'unauthorized',
  'invalid-request',
  'context-length',
  'content-filter',
]);

/**
 * Classify a thrown provider error as retryable (also
 * fallback-eligible) or terminal.
 *
 * Decision order:
 *
 * 1. Non-object throws are never retryable.
 * 2. An aborted request is never retryable, even when it surfaces as
 *    a `status: 0` network error. The retry loop also
 *    short-circuits on `req.signal?.aborted`, but the predicate must
 *    exclude abort independently so an internally-aborted call is not
 *    retried.
 * 3. The canonical kind decides when recognised. `ProviderHttpError.kind`
 *    is always the stable `'provider-http'` discriminant; the mapped
 *    canonical kind rides on `errorKind` - both are consulted.
 *    Transient kinds (`transient`, `rate-limit`, `rate-limit-exceeded`,
 *    `capacity`) are retryable; terminal kinds (`unauthorized`,
 *    `invalid-request`, `context-length`, `content-filter`) are not.
 * 4. HTTP status fallback for errors without a recognised kind:
 *    `429` and `5xx` retry; `status: 0` is a fetch-level network
 *    failure (ECONNREFUSED, DNS, connection reset, request timeout) -
 *    exactly the transient class `withRetry` documents - and retries
 *    (abort already excluded above).
 *
 * @stable
 */
export function isRetryableProviderFailure(err: unknown): boolean {
  if (err === null || typeof err !== 'object') return false;
  if (isAbortError(err)) return false;
  const e = err as { kind?: string; errorKind?: string; status?: number };
  const kinds = [e.kind, e.errorKind];
  if (kinds.some((k) => k !== undefined && TRANSIENT_KINDS.has(k))) return true;
  if (kinds.some((k) => k !== undefined && TERMINAL_KINDS.has(k))) return false;
  if (typeof e.status === 'number' && e.status === 429) return true;
  // Statuses above 599 are not valid HTTP and never reach here from
  // the shipped adapters; the bound just keeps garbage out.
  if (typeof e.status === 'number' && e.status >= 500 && e.status < 600) return true;
  if (typeof e.status === 'number' && e.status === 0) return true;
  return false;
}

/**
 * Read a `Retry-After` hint from a thrown error. Recognises:
 *
 * - errors carrying a `retryAfterMs` field (already milliseconds) -
 *   `RateLimitExceededError` and `ProviderHttpError` with a numeric
 *   `Retry-After` response header both stamp it;
 * - errors carrying a `retryAfterSeconds` numeric field;
 * - HTTP-shaped errors carrying a `headers['retry-after']` value
 *   (numeric seconds, or an HTTP-date resolved against the current
 *   clock).
 *
 * Returns the resolved delay in milliseconds or `null` when no hint
 * is available. `withRetry` consumes this to honour server-provided
 * backoff over its own schedule.
 *
 * @stable
 */
export function readRetryAfterMs(err: unknown): number | null {
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
