/**
 * Machine-readable error envelope for the server boundary.
 *
 * The packages disagree on the error discriminator by history:
 * `@graphorin/agent` / `@graphorin/workflow` use `code`,
 * `@graphorin/tools` / `@graphorin/memory` / `@graphorin/provider` /
 * the server's own errors use `kind`. Renaming either family is a
 * breaking change to no benefit - NORMALIZATION IS THE SERVER
 * BOUNDARY'S JOB. Every wire payload that reports a failure funnels
 * through {@link toWireError}, so clients branch on one stable `code`
 * field (e.g. retry `checkpoint-version-conflict`, abandon
 * `node-execution-failed`) instead of parsing English prose.
 *
 * @packageDocumentation
 */

/** Normalized error envelope for wire payloads. */
export interface WireError {
  /** `err.code` if a string, else `err.kind` if a string, else `'unknown'`. */
  readonly code: string;
  readonly message: string;
  /** Operator hint when the source error carries one (`WorkflowError.hint`). */
  readonly hint?: string;
}

/** Normalize any thrown value into the wire envelope. */
export function toWireError(err: unknown): WireError {
  if (err !== null && typeof err === 'object') {
    const rec = err as { code?: unknown; kind?: unknown; message?: unknown; hint?: unknown };
    const code =
      typeof rec.code === 'string' && rec.code.length > 0
        ? rec.code
        : typeof rec.kind === 'string' && rec.kind.length > 0
          ? rec.kind
          : 'unknown';
    const message = typeof rec.message === 'string' ? rec.message : String(err);
    return {
      code,
      message,
      ...(typeof rec.hint === 'string' && rec.hint.length > 0 ? { hint: rec.hint } : {}),
    };
  }
  return { code: 'unknown', message: String(err) };
}
