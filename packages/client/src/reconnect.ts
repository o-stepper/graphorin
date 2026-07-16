/**
 * Pure-functional reconnect-backoff helper. Encapsulated in its own
 * module so the `GraphorinClient` stays free of timing
 * heuristics - and so tests can drive the policy with a deterministic
 * RNG.
 *
 * Algorithm: exponential backoff with full-jitter
 * (`delay = random(0, min(maxMs, baseMs * 2^(attempt-1)))`). The
 * implementation matches the AWS Architecture Blog "exponential
 * backoff and jitter" reference but is otherwise an original
 * formulation.
 *
 * @packageDocumentation
 */

/**
 * Stable shape consumed by {@link computeBackoffMs}.
 *
 * @stable
 */
export interface BackoffPolicy {
  /** Initial slot in milliseconds. Default `500`. */
  readonly baseMs?: number;
  /** Cap on every individual sleep. Default `30_000`. */
  readonly maxMs?: number;
  /**
   * Hard cap on the number of attempts. The client surfaces a
   * `TransportFailedError` once exceeded. Default `Infinity`.
   */
  readonly maxAttempts?: number;
  /**
   * Optional injection seam used by tests; defaults to `Math.random`.
   */
  readonly random?: () => number;
}

/**
 * Compute the number of milliseconds to sleep before the
 * `attempt`-th reconnect (1-indexed). Returns `null` when the policy
 * has been exhausted (`attempt > maxAttempts`).
 *
 * @stable
 */
export function computeBackoffMs(attempt: number, policy: BackoffPolicy = {}): number | null {
  if (!Number.isFinite(attempt) || attempt < 1) {
    throw new RangeError('computeBackoffMs: attempt must be a positive integer.');
  }
  const baseMs = policy.baseMs ?? 500;
  const maxMs = policy.maxMs ?? 30_000;
  const maxAttempts = policy.maxAttempts ?? Number.POSITIVE_INFINITY;
  const random = policy.random ?? Math.random;
  if (attempt > maxAttempts) return null;
  // Exponential growth with full jitter, clamped to maxMs.
  const exp = Math.min(maxMs, baseMs * 2 ** Math.min(attempt - 1, 30));
  return Math.floor(random() * exp);
}

/**
 * Resolve when the requested number of milliseconds elapsed, or
 * reject (with a `DOMException`-style abort error) when the
 * supplied `AbortSignal` fires first.
 *
 * @stable
 */
export function sleep(durationMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(abortError(signal.reason));
  }
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, durationMs);
    const onAbort = (): void => {
      cleanup();
      reject(abortError(signal?.reason));
    };
    const cleanup = (): void => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function abortError(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  const err = new Error('Aborted.');
  err.name = 'AbortError';
  return err;
}
