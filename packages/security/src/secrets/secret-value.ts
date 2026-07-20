import { Buffer } from 'node:buffer';
import { timingSafeEqual } from 'node:crypto';

import {
  NODEJS_INSPECT_CUSTOM,
  SECRET_VALUE_BRAND,
  type SecretValue as SecretValueContract,
  type SecretValueOptions,
} from '@graphorin/core/contracts';

/**
 * Module-level redaction marker. Returned by every leakage barrier so
 * `console.log`, `JSON.stringify`, template literals, `String(...)`,
 * `util.inspect(...)`, and `new Error(value).message` never reveal the
 * underlying secret.
 */
const REDACTED_PLACEHOLDER = '[SECRET]';

/**
 * Marker that `[Symbol.for('nodejs.util.inspect.custom')]` returns. The
 * decorated form makes accidental inclusion in structured logs obvious.
 */
const INSPECT_PLACEHOLDER = 'SecretValue([REDACTED])';

/**
 * Hook signature subscribed by the audit log. The audit log is wired up
 * by a sibling sub-package; this module merely calls every registered
 * listener on `.reveal()` and `.use(...)` so the audit log can attribute
 * each unwrap event.
 *
 * @stable
 */
export type SecretValueAuditEvent = {
  readonly action: 'reveal' | 'use' | 'use-buffer' | 'dispose' | 'construct';
  readonly source?: { readonly resolver?: string; readonly ref?: string };
  /** Best-effort caller scope (set by `withSecret(...)` if active). */
  readonly scopeId?: string;
  /** Best-effort caller name (set by `withSecret(...)` if active). */
  readonly caller?: string;
  /** Length of the underlying buffer in bytes. Safe to log. */
  readonly length: number;
  /** Epoch milliseconds at the moment of the event. */
  readonly ts: number;
};

/**
 * Callback shape accepted by {@link onSecretValueAudit}.
 *
 * @stable
 */
export type SecretValueAuditListener = (event: SecretValueAuditEvent) => void;

const auditListeners = new Set<SecretValueAuditListener>();

/**
 * Subscribe to `SecretValue` lifecycle events (construct / reveal / use /
 * dispose). The audit-log sub-package uses this to record every unwrap
 * with the active actor; tests use it to assert that scoped access
 * patterns trigger exactly one event per call.
 *
 * Returns an unsubscribe function.
 *
 * @stable
 */
export function onSecretValueAudit(listener: SecretValueAuditListener): () => void {
  auditListeners.add(listener);
  return () => {
    auditListeners.delete(listener);
  };
}

/**
 * Resets the audit listener set. Tests use this to isolate fixtures;
 * production code never calls it.
 *
 * @experimental
 */
export function _resetSecretValueAuditListenersForTesting(): void {
  auditListeners.clear();
}

function emitAudit(event: SecretValueAuditEvent): void {
  if (auditListeners.size === 0) return;
  for (const listener of auditListeners) {
    try {
      listener(event);
    } catch {
      // Audit listeners must never throw into the secret read path.
      // Errors are swallowed deliberately; the audit-log sub-package is
      // expected to handle its own logging via a separate fail-safe.
    }
  }
}

/**
 * Optional caller-context set by `withSecret(...)`. The class reads this
 * lazily so we keep the no-context fast path zero-overhead and avoid a
 * cycle between `secret-value.ts` and `acl.ts`.
 *
 * @internal
 */
export interface SecretValueCallerContext {
  readonly scopeId?: string;
  readonly caller?: string;
}

let activeCallerContextProvider: (() => SecretValueCallerContext | undefined) | undefined;

/**
 * Internal hook used by `acl.ts` to provide the AsyncLocalStorage-bound
 * caller context. Re-export only for the secrets module - never expose
 * to consumers.
 *
 * @internal
 */
export function _setSecretValueCallerContextProvider(
  provider: (() => SecretValueCallerContext | undefined) | undefined,
): void {
  activeCallerContextProvider = provider;
}

function readCallerContext(): SecretValueCallerContext | undefined {
  return activeCallerContextProvider ? activeCallerContextProvider() : undefined;
}

/**
 * Runtime-safe wrapper around an opaque secret string or byte string.
 *
 * `SecretValue` is the **single canonical implementation** of the
 * `SecretValue` contract declared in `@graphorin/core`. Every secret
 * crossing module boundaries inside the framework is wrapped in a
 * `SecretValue` so that:
 *
 * - `console.log(value)`, `JSON.stringify({ apiKey: value })`,
 *   `` `Bearer ${value}` ``, `String(value)`, `util.inspect(value)`,
 *   and `new Error(String(value)).message` all emit a redacted
 *   placeholder rather than the underlying value.
 * - The wrapper exposes the raw bytes only through `use(fn)` /
 *   `useBuffer(fn)` (scoped reads) or the audited one-shot `reveal()`
 *   escape hatch.
 * - `dispose()` makes a best-effort attempt to zero the backing
 *   `Buffer`. (V8 strings derived through `use(fn)` / `reveal()` are
 *   immutable and cannot be zeroed; this is documented honestly.)
 *
 * The class fixes the `[SECRET_VALUE_BRAND]` symbol so the cross-realm
 * type guard `SecretValue.isSecretValue(...)` works for instances
 * constructed in Worker threads or `vm` contexts.
 *
 * @stable
 */
export class SecretValue implements SecretValueContract {
  readonly #value: Buffer;
  #disposed: boolean = false;

  /** Free-form provenance string carried for audit telemetry. */
  readonly source?: { readonly resolver?: string; readonly ref?: string };
  /** Epoch milliseconds at construction time. Safe to log. */
  readonly fetchedAt: number;
  /** Optional TTL in milliseconds. Carriers for resolver caching. */
  readonly ttlMs?: number;

  // Cross-realm brand. Set on the prototype so `Symbol.for(...)` lookups
  // succeed across vm / Worker contexts even when the prototype chain
  // does not match the constructor identity.
  readonly [SECRET_VALUE_BRAND]: true = true;

  private constructor(buf: Buffer, opts?: SecretValueOptions & { ttlMs?: number }) {
    // Defensive copy: callers may mutate the buffer they passed in. We
    // also intentionally allow zero-length buffers - `parseSecretRef`
    // returns SecretValue(0) for empty `env:KEY` lookups.
    this.#value = Buffer.from(buf);
    this.fetchedAt = Date.now();
    if (opts?.source !== undefined) this.source = opts.source;
    if (opts?.ttlMs !== undefined) this.ttlMs = opts.ttlMs;

    const callerCtx = readCallerContext();
    emitAudit({
      action: 'construct',
      length: this.#value.length,
      ts: this.fetchedAt,
      ...(this.source ? { source: this.source } : {}),
      ...(callerCtx?.scopeId ? { scopeId: callerCtx.scopeId } : {}),
      ...(callerCtx?.caller ? { caller: callerCtx.caller } : {}),
    });
  }

  /**
   * Wrap a UTF-8 string. Use this at the I/O boundary (env reads,
   * keyring reads, file reads, OAuth callback response) - not from
   * deep inside business logic where the raw value would already have
   * leaked to a V8 string.
   *
   * @stable
   */
  static fromString(raw: string, opts?: SecretValueOptions & { ttlMs?: number }): SecretValue {
    return new SecretValue(Buffer.from(raw, 'utf8'), opts);
  }

  /**
   * Wrap a `Buffer`. The buffer is **defensively copied**; callers may
   * safely zero or reuse their input.
   *
   * @stable
   */
  static fromBuffer(buf: Buffer, opts?: SecretValueOptions & { ttlMs?: number }): SecretValue {
    return new SecretValue(buf, opts);
  }

  /**
   * Cross-realm safe `instanceof` replacement. Returns `true` for any
   * object carrying `Symbol.for('graphorin.SecretValue')` set to `true`
   * - including instances constructed in Worker threads / vm contexts.
   *
   * @stable
   */
  static isSecretValue(value: unknown): value is SecretValue {
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return false;
    return (value as { [k: symbol]: unknown })[SECRET_VALUE_BRAND] === true;
  }

  /**
   * Constant-time byte equality. Returns `false` if either input has
   * been disposed or the lengths differ; otherwise delegates to
   * `crypto.timingSafeEqual` to avoid leaking length-independent
   * timing information.
   *
   * @stable
   */
  static timingSafeEquals(a: SecretValue, b: SecretValue): boolean {
    if (a.#disposed || b.#disposed) return false;
    if (a.#value.length !== b.#value.length) return false;
    return timingSafeEqual(a.#value, b.#value);
  }

  /** Length of the wrapped value in bytes. Safe to log. */
  get length(): number {
    return this.#value.length;
  }

  /** Whether `dispose()` has been called. */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * Run `fn` with the unwrapped string and return its (possibly
   * `Promise`-wrapped) result. Preferred over `.reveal()` because it
   * scopes the V8 string literal to a single call.
   *
   * @stable
   */
  async use<T>(fn: (raw: string) => T | Promise<T>): Promise<T> {
    this.#assertLive();
    const callerCtx = readCallerContext();
    emitAudit({
      action: 'use',
      length: this.#value.length,
      ts: Date.now(),
      ...(this.source ? { source: this.source } : {}),
      ...(callerCtx?.scopeId ? { scopeId: callerCtx.scopeId } : {}),
      ...(callerCtx?.caller ? { caller: callerCtx.caller } : {}),
    });
    return await fn(this.#value.toString('utf8'));
  }

  /**
   * Run `fn` with the unwrapped value as a `Buffer`. Use this for
   * binary secrets (encryption keys, HMAC keys) where round-tripping
   * through a V8 string would defeat the wrapper's hygiene.
   *
   * @stable
   */
  async useBuffer<T>(fn: (buf: Buffer) => T | Promise<T>): Promise<T> {
    this.#assertLive();
    const callerCtx = readCallerContext();
    emitAudit({
      action: 'use-buffer',
      length: this.#value.length,
      ts: Date.now(),
      ...(this.source ? { source: this.source } : {}),
      ...(callerCtx?.scopeId ? { scopeId: callerCtx.scopeId } : {}),
      ...(callerCtx?.caller ? { caller: callerCtx.caller } : {}),
    });
    // Hand the caller a defensive copy so any mutation does not
    // affect the wrapper's internal state.
    return await fn(Buffer.from(this.#value));
  }

  /**
   * One-shot escape hatch - returns the unwrapped string. Audited.
   * Prefer `.use(fn)` whenever possible.
   *
   * @stable
   */
  reveal(): string {
    this.#assertLive();
    const callerCtx = readCallerContext();
    emitAudit({
      action: 'reveal',
      length: this.#value.length,
      ts: Date.now(),
      ...(this.source ? { source: this.source } : {}),
      ...(callerCtx?.scopeId ? { scopeId: callerCtx.scopeId } : {}),
      ...(callerCtx?.caller ? { caller: callerCtx.caller } : {}),
    });
    return this.#value.toString('utf8');
  }

  /**
   * @deprecated Use `.reveal()` for the explicit one-shot read or
   *   `.use(fn)` for the preferred scoped read. Retained for the
   *   `0.x` compatibility window only - slated for removal in the
   *   next major release. The companion lint rule
   *   `@graphorin/no-secret-unwrap` flags every use of this method.
   *
   * @stable
   */
  unwrap(): string {
    return this.reveal();
  }

  /**
   * Best-effort zeroization of the underlying buffer. Idempotent. Does
   * not affect derived V8 strings already created via `.use(fn)` /
   * `.reveal()` - that limitation is fundamental and documented.
   *
   * @stable
   */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#value.fill(0);
    emitAudit({
      action: 'dispose',
      length: this.#value.length,
      ts: Date.now(),
      ...(this.source ? { source: this.source } : {}),
    });
  }

  // ---------- Leakage barriers ----------

  /**
   * `String(value)` / `'' + value` / `Buffer.from(value)` go through
   * `Symbol.toPrimitive` first per ECMA-262 § 7.1.1 and end up here.
   *
   * @stable
   */
  toString(): string {
    return REDACTED_PLACEHOLDER;
  }

  /**
   * `Symbol.toPrimitive` takes precedence over `toString` /
   * `valueOf` for both `String` and `Number` hints, so this is the
   * primary leakage barrier for template literals.
   *
   * @stable
   */
  [Symbol.toPrimitive](hint: string): string | number {
    if (hint === 'number') return Number.NaN;
    return REDACTED_PLACEHOLDER;
  }

  /**
   * `JSON.stringify({ apiKey: secret })` invokes `toJSON()` per
   * ECMA-262 § 25.5.2 - returning the placeholder ensures structured
   * logging never serializes the raw value.
   *
   * @stable
   */
  toJSON(): string {
    return REDACTED_PLACEHOLDER;
  }

  /**
   * Custom inspector hook used by `console.log`, `util.inspect`, and
   * `util.format('%O', value)`. Returns a verbose, distinct marker so
   * a `SecretValue` is recognisable in REPL / structured output.
   *
   * @stable
   */
  [NODEJS_INSPECT_CUSTOM](): string {
    return INSPECT_PLACEHOLDER;
  }

  // ---------- Internals ----------

  #assertLive(): void {
    if (this.#disposed) {
      throw new Error('Cannot read a disposed SecretValue.');
    }
  }
}

// Pin the cross-realm brand on the prototype so that
// `(value as Record<symbol, unknown>)[SECRET_VALUE_BRAND]` succeeds for
// instances constructed in Worker threads - the prototype lookup
// works even when the constructor identity differs.
Reflect.defineProperty(SecretValue.prototype, SECRET_VALUE_BRAND, {
  value: true,
  enumerable: false,
  writable: false,
  configurable: false,
});
