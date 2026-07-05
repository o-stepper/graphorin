/**
 * Typed errors tool authors throw from `execute(...)` to reach a specific
 * model-visible `ToolErrorKind` (tools-06). Anything else a tool throws
 * flattens to `execution_failed`; these carriers keep the taxonomy honest:
 *
 * - {@link ToolRateLimitError} → kind `'rate_limited'` - the upstream
 *   service refused the call for pacing reasons; the call is safe to
 *   retry after a delay.
 *
 * (Sandbox violations map automatically from the sandbox's structured
 * result; there is no author-thrown carrier for them.)
 *
 * @packageDocumentation
 */

/**
 * Throw from a tool's `execute(...)` when the upstream service rate-limits
 * the call. The executor maps it to the `'rate_limited'` ToolErrorKind and
 * surfaces `retryAfterMs` (when known) on the error hint so the model -
 * and any harness-side retry - can pace correctly.
 *
 * @stable
 */
export class ToolRateLimitError extends Error {
  /** Milliseconds the caller should wait before retrying, when known. */
  readonly retryAfterMs?: number;

  constructor(message: string, options?: { readonly retryAfterMs?: number }) {
    super(message);
    this.name = 'ToolRateLimitError';
    if (options?.retryAfterMs !== undefined) {
      this.retryAfterMs = options.retryAfterMs;
    }
  }
}
