/**
 * Cross-realm symbol used to brand `SecretValue` instances. Implementations
 * (e.g. the wrapper class shipped from `@graphorin/security`) attach this
 * symbol so that `isSecretValue(...)` works across realms (Worker threads,
 * sandboxes, etc.).
 *
 * @stable
 */
export const SECRET_VALUE_BRAND: unique symbol = Symbol.for('graphorin.SecretValue');

/**
 * Well-known symbol used by `node:util.inspect()` to format the wrapper.
 * Re-exported here so downstream packages can reference it without taking
 * an unconditional dependency on `node:util`.
 *
 * Equivalent to `Symbol.for('nodejs.util.inspect.custom')`.
 *
 * @stable
 */
export const NODEJS_INSPECT_CUSTOM: unique symbol = Symbol.for('nodejs.util.inspect.custom');

/**
 * Runtime-safe wrapper around an opaque secret (API key, token, password).
 *
 * The shape declared here is the **interface contract**: the concrete
 * wrapper class lives in `@graphorin/security`. Downstream packages typing
 * a parameter as `SecretValue` therefore avoid taking a security
 * dependency.
 *
 * Note: `SecretValue` is **not** a TypeScript branded primitive — it is
 * a full wrapper class with explicit leakage barriers
 * (`Symbol.toPrimitive`, `toJSON`, `[nodejs.util.inspect.custom]`, …).
 * Any conforming implementation must ensure that:
 *
 * - String coercion (`String(s)`, `` `${s}` ``, `s + ''`, …) yields a
 *   redacted placeholder, **not** the underlying value.
 * - JSON serialization (`JSON.stringify({ apiKey: s })`) yields a
 *   redacted placeholder.
 * - Inspector output (`util.inspect(s)`) yields
 *   `'SecretValue([REDACTED])'`.
 * - The underlying value is only reachable through `.use(fn)`,
 *   `.useBuffer(fn)` or the audited `.reveal()` escape hatch.
 *
 * @stable
 */
export interface SecretValue {
  /** Number of bytes in the wrapped value. Safe to log. */
  readonly length: number;

  /**
   * Run `fn` with the unwrapped string and return its result. Preferred
   * over `.reveal()` because it scopes the unwrapped value to a single
   * synchronous / asynchronous turn.
   */
  use<T>(fn: (raw: string) => T | Promise<T>): Promise<T>;

  /**
   * Run `fn` with the unwrapped value as a `Buffer`. Useful for binary
   * secrets (encryption keys, HMAC keys) where round-tripping through a
   * V8 string would defeat the wrapper's hygiene.
   */
  useBuffer<T>(fn: (buf: Buffer) => T | Promise<T>): Promise<T>;

  /**
   * One-shot reveal as a string. Audited by the implementation. Prefer
   * `.use(fn)` whenever possible.
   */
  reveal(): string;

  /**
   * Best-effort zeroization of the underlying buffer. Does not affect
   * derived V8 strings already created via `.use(fn)` / `.reveal()`.
   */
  dispose(): void;

  /** Cross-realm brand. Implementations set this to `SECRET_VALUE_BRAND`. */
  readonly [SECRET_VALUE_BRAND]: true;

  /** Leakage barrier for ToPrimitive coercion. Returns the placeholder. */
  [Symbol.toPrimitive](hint: string): string | number;

  /** Leakage barrier for `JSON.stringify(...)`. Returns the placeholder. */
  toJSON(): string;

  /**
   * Leakage barrier for `node:util.inspect(...)`. Returns the placeholder
   * (`'SecretValue([REDACTED])'`) so that REPL / `console.log` /
   * structured-logger output never reveals the underlying value.
   */
  [NODEJS_INSPECT_CUSTOM](depth?: number, opts?: unknown, inspect?: unknown): string;
}

/**
 * Static helpers expected on every concrete `SecretValue` constructor.
 *
 * @stable
 */
export interface SecretValueStatic {
  /** Cross-realm safe type guard. */
  isSecretValue(value: unknown): value is SecretValue;
  /** Constant-time equality. */
  timingSafeEquals(a: SecretValue, b: SecretValue): boolean;
  /** Construct from a plain string. */
  fromString(raw: string, opts?: SecretValueOptions): SecretValue;
  /** Construct from a Node.js `Buffer`. */
  fromBuffer(buf: Buffer, opts?: SecretValueOptions): SecretValue;
}

/**
 * Optional metadata attached to a freshly constructed `SecretValue`.
 *
 * @stable
 */
export interface SecretValueOptions {
  /** Free-form provenance string for the audit log. */
  readonly source?: { readonly resolver?: string; readonly ref?: string };
}
