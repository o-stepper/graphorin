/**
 * Typed error hierarchy for `@graphorin/provider`. Every error class
 * carries a stable `kind` discriminant (lowercase, kebab-case) plus an
 * optional `hint` string pointing the user at the recommended fix.
 *
 * @packageDocumentation
 */

import type { ProviderErrorKind } from '@graphorin/core';

/**
 * Base class for every error thrown by `@graphorin/provider`. Consumers
 * narrow on the discriminant `kind` rather than `instanceof` — both
 * work, but discriminants are subclass-friendly.
 *
 * @stable
 */
export class GraphorinProviderError extends Error {
  override readonly name: string = 'GraphorinProviderError';
  /** Stable discriminant — `'middleware-ordering'`, `'rate-limit-exceeded'`, … */
  readonly kind: string;
  /** Optional remediation hint shown alongside the message. */
  readonly hint?: string;

  constructor(kind: string, message: string, options?: { cause?: unknown; hint?: string }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.kind = kind;
    if (options?.hint !== undefined) {
      this.hint = options.hint;
    }
  }
}

/**
 * The middleware composer detected an out-of-order middleware. The
 * `offendingPair` field carries the `[outer, inner]` middleware names
 * that violated the canonical order so consumers can surface a precise
 * fix in IDE diagnostics.
 *
 * @stable
 */
export class MiddlewareOrderingError extends GraphorinProviderError {
  override readonly name = 'MiddlewareOrderingError';
  readonly offendingPair: readonly [string, string];
  readonly canonicalOrder: readonly string[];

  constructor(args: {
    offendingPair: readonly [string, string];
    canonicalOrder: readonly string[];
    message?: string;
  }) {
    super(
      'middleware-ordering',
      args.message ??
        `Middleware order violation: '${args.offendingPair[0]}' must not wrap '${args.offendingPair[1]}'. ` +
          `Canonical order (outer → inner): ${args.canonicalOrder.join(' → ')}.`,
      {
        hint:
          'Reorder the middleware array passed to composeProviderMiddleware([...]) to match the canonical order; ' +
          'see @graphorin/provider/middleware for documentation.',
      },
    );
    this.offendingPair = args.offendingPair;
    this.canonicalOrder = args.canonicalOrder;
  }
}

/**
 * `withRedaction` was missing at production startup. Thrown by the
 * production hook applied to every composed provider when
 * `process.env.NODE_ENV === 'production'`.
 *
 * @stable
 */
export class MissingProductionMiddlewareError extends GraphorinProviderError {
  override readonly name = 'MissingProductionMiddlewareError';
  readonly missing: string;

  constructor(missing: string) {
    super(
      'missing-production-middleware',
      `Production startup hook: required middleware '${missing}' is missing from the provider chain.`,
      {
        hint:
          `Compose '${missing}' as the innermost layer (closest to the underlying provider) before deploying. ` +
          'See @graphorin/provider/middleware for the canonical composition order.',
      },
    );
    this.missing = missing;
  }
}

/**
 * `withCostLimit` exceeded its configured ceiling. Carries the
 * triggering scope (`session`, `agent`, `run`, …) so the caller can
 * decide how to surface the breach.
 *
 * @stable
 */
export class CostBudgetExceededError extends GraphorinProviderError {
  override readonly name = 'CostBudgetExceededError';
  readonly scope: string;
  readonly limit: number;
  readonly observed: number;

  constructor(args: { scope: string; limit: number; observed: number; currency?: string }) {
    super(
      'cost-budget-exceeded',
      `Cost budget exceeded for '${args.scope}': observed ${args.observed.toFixed(4)} ${args.currency ?? 'USD'} ` +
        `> limit ${args.limit.toFixed(4)} ${args.currency ?? 'USD'}.`,
      {
        hint: 'Raise the limit in withCostLimit({...}), tighten the prompt, or switch to a cheaper model tier.',
      },
    );
    this.scope = args.scope;
    this.limit = args.limit;
    this.observed = args.observed;
  }
}

/**
 * `withRateLimit` exhausted its bucket and the caller did not opt
 * into `'queue'` mode.
 *
 * @stable
 */
export class RateLimitExceededError extends GraphorinProviderError {
  override readonly name = 'RateLimitExceededError';
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super('rate-limit-exceeded', `Rate limit exceeded; retry after ${retryAfterMs}ms.`, {
      hint: 'Slow down the request rate, raise the bucket size in withRateLimit({...}), or switch to mode: "queue".',
    });
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * `withRedaction` detected a hit AND the policy is configured for
 * `failClosed: true`. The matched value is **never** part of the
 * message — only the pattern name and field path.
 *
 * @stable
 */
export class PromptRedactionError extends GraphorinProviderError {
  override readonly name = 'PromptRedactionError';
  readonly patternName: string;
  readonly fieldPath: string;
  readonly role?: string;

  constructor(args: { patternName: string; fieldPath: string; role?: string }) {
    super(
      'prompt-redaction-fail-closed',
      `Outbound prompt-redaction policy is fail-closed and matched pattern '${args.patternName}' ` +
        `at '${args.fieldPath}'${args.role ? ` (role: ${args.role})` : ''}.`,
      {
        hint: 'Sanitize the prompt before calling the provider, or disable failClosed in withRedaction({...}) for this environment.',
      },
    );
    this.patternName = args.patternName;
    this.fieldPath = args.fieldPath;
    if (args.role !== undefined) this.role = args.role;
  }
}

/**
 * Raised when a `baseUrl`-driven local adapter is configured against
 * a public host over plaintext HTTP. Adapters refuse to start unless
 * `allowInsecureTransport: true` is supplied (and the override is
 * audit-logged).
 *
 * @stable
 */
export class LocalProviderInsecureTransportError extends GraphorinProviderError {
  override readonly name = 'LocalProviderInsecureTransportError';
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    super(
      'local-provider-insecure-transport',
      `Refusing to start: the provider baseUrl '${baseUrl}' is public AND plaintext (http://). ` +
        `Switch to https:// or set allowInsecureTransport: true to acknowledge the risk.`,
      {
        hint:
          'Public local-LLM endpoints must be served over TLS. Acceptable alternatives: terminate TLS in front of the model server, ' +
          'tunnel through SSH / WireGuard / Tailscale, or pass allowInsecureTransport: true (audit-logged).',
      },
    );
    this.baseUrl = baseUrl;
  }
}

/**
 * Legacy alias preserved for one minor; prefer
 * {@link LocalProviderInsecureTransportError}. Removed in v0.2.
 *
 * @deprecated Use {@link LocalProviderInsecureTransportError} instead.
 */
export const OllamaInsecureTransportError = LocalProviderInsecureTransportError;
export type OllamaInsecureTransportError = LocalProviderInsecureTransportError;

/**
 * Body phrasings used by the major providers when the request blew the
 * model's context window. Sniffed by {@link classifyHttpStatus} so a
 * 400 that is really a context overflow surfaces as `'context-length'`
 * (the kind the compaction / emergency tiers key on), not a generic
 * `'invalid-request'`.
 */
const CONTEXT_LENGTH_BODY_RE =
  /context[_ -]?length|context window|prompt is too long|maximum context|too many tokens|exceeds? the (?:model'?s? )?max/i;

/**
 * Map an HTTP status (plus optional error-body text) onto the
 * canonical {@link import('@graphorin/core').ProviderErrorKind}. One
 * shared table so `withRetry` / `withFallback` and consumers switching
 * on the documented kinds see consistent values from every HTTP
 * adapter:
 *
 * - `429` → `'rate-limit'`
 * - `401` / `403` → `'unauthorized'`
 * - `400` / `404` / `422` → `'invalid-request'` (or
 *   `'context-length'` when the body says so)
 * - `503` / `529` → `'capacity'` (529 is Anthropic's overloaded code)
 * - other `5xx` and `0` (network failure) → `'transient'`
 *
 * @stable
 */
export function classifyHttpStatus(status: number, bodyText?: string): ProviderErrorKind {
  if (status === 429) return 'rate-limit';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 400 || status === 404 || status === 422) {
    if (bodyText !== undefined && CONTEXT_LENGTH_BODY_RE.test(bodyText)) return 'context-length';
    return 'invalid-request';
  }
  if (status === 503 || status === 529) return 'capacity';
  if (status >= 500 || status === 0) return 'transient';
  return 'unknown';
}

/**
 * Wrapped HTTP error returned by an adapter. Carries the original
 * status code so middleware (`withRetry`, `withFallback`) can decide
 * whether the error is retryable.
 *
 * @stable
 */
export class ProviderHttpError extends GraphorinProviderError {
  override readonly name = 'ProviderHttpError';
  readonly status: number;
  readonly providerName: string;
  /**
   * The canonical `ProviderErrorKind` mapped from the HTTP status via
   * {@link classifyHttpStatus} (the `kind` field keeps its stable
   * `'provider-http'` discriminant). Middleware predicates consult
   * this so a 429 fails over / retries as a rate limit.
   */
  readonly errorKind: ProviderErrorKind;
  /**
   * Backoff-relevant response headers captured from the failed
   * response (`retry-after`, `x-ratelimit-*`), lowercased.
   * `withRetry`'s Retry-After hint reader consumes them.
   */
  readonly headers?: Readonly<Record<string, string>>;

  constructor(args: {
    providerName: string;
    status: number;
    message: string;
    cause?: unknown;
    errorKind?: ProviderErrorKind;
    headers?: Readonly<Record<string, string>>;
  }) {
    super('provider-http', `[${args.providerName}] HTTP ${args.status}: ${args.message}`, {
      ...(args.cause !== undefined ? { cause: args.cause } : {}),
    });
    this.providerName = args.providerName;
    this.status = args.status;
    this.errorKind = args.errorKind ?? classifyHttpStatus(args.status, args.message);
    if (args.headers !== undefined) this.headers = args.headers;
  }
}

/**
 * The streaming response did not match the documented wire format
 * (e.g. malformed SSE chunk, truncated JSON).
 *
 * @stable
 */
export class ProviderStreamParseError extends GraphorinProviderError {
  override readonly name = 'ProviderStreamParseError';
  readonly providerName: string;

  constructor(providerName: string, message: string, cause?: unknown) {
    super('provider-stream-parse', `[${providerName}] ${message}`, {
      ...(cause !== undefined ? { cause } : {}),
    });
    this.providerName = providerName;
  }
}

/**
 * The classifier dispatcher was given a non-Provider value. Programming
 * error; fail-fast at the boundary.
 *
 * @stable
 */
export class InvalidProviderError extends GraphorinProviderError {
  override readonly name = 'InvalidProviderError';

  constructor(message: string) {
    super('invalid-provider', message, {
      hint: 'Pass the value returned by createProvider(...) (or any adapter factory) instead of a raw object.',
    });
  }
}
