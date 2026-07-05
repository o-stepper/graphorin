/**
 * Dead-letter queue helpers - pure functions used by the standard
 * + deep phases. The actual persistence lives in the storage
 * adapter's `enqueueFailedBatch / claimReadyBatches / ...` surface.
 *
 * @packageDocumentation
 */

/**
 * Compute the next retry delay given the failure count + retry
 * policy. Implements full-jitter exponential backoff capped by
 * `maxBackoffMs`.
 *
 * The formula is `delay = random(0, min(maxBackoffMs, baseMs * 2^retryCount))`
 * where `random` is the optional `jitter` callback (defaults to
 * `Math.random()`).
 *
 * @stable
 */
export function nextBackoffMs(args: {
  readonly retryCount: number;
  readonly baseMs: number;
  readonly maxMs: number;
  readonly jitter?: () => number;
}): number {
  const cap = Math.min(args.maxMs, args.baseMs * 2 ** Math.max(0, args.retryCount));
  const jitter = args.jitter ?? Math.random;
  return Math.max(0, Math.floor(cap * jitter()));
}

/**
 * Classify a thrown error into the lowercase `error_kind` value
 * recorded against `consolidator_failed_batches`. Used by the phases
 * so the DLQ row carries a stable discriminator instead of free-form
 * prose.
 *
 * @stable
 */
export function classifyError(err: unknown): string {
  if (err === null || err === undefined) return 'unknown';
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  if (message.includes('rate limit') || message.includes('429')) return 'rate_limit';
  if (message.includes('5xx') || message.includes('500') || message.includes('502')) return '5xx';
  if (message.includes('timeout')) return 'timeout';
  if (message.includes('embedder') || message.includes('embedding')) return 'embedder_failed';
  if (message.includes('invalid') || message.includes('parse')) return 'invalid_response';
  if (message.includes('budget')) return 'budget';
  return 'unknown';
}

/**
 * Best-effort error message extraction.
 *
 * @internal
 */
export function describeError(err: unknown): string {
  if (err === null || err === undefined) return 'unknown error';
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
