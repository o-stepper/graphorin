/**
 * Typed errors raised by the server token-auth surface of
 * `@graphorin/security`. Every error carries a stable lowercase `kind`
 * discriminator and an optional remediation `hint`.
 *
 * @packageDocumentation
 */

import { GraphorinSecretsError } from '../secrets/errors.js';

/**
 * Discriminator union for `TokenFormatError`. Lets callers branch on
 * the concrete failure mode without parsing the message string.
 *
 * @stable
 */
export type TokenFormatErrorKind =
  | 'empty-input'
  | 'wrong-prefix'
  | 'wrong-version'
  | 'wrong-length'
  | 'invalid-environment'
  | 'invalid-entropy'
  | 'invalid-checksum';

/**
 * Raised when a raw token does not match the canonical
 * `<prefix>_<env>_v1_<entropy>_<crc>` shape. The error never carries
 * the raw input; only its length and a stable `kind`.
 *
 * @stable
 */
export class TokenFormatError extends GraphorinSecretsError {
  override readonly kind: TokenFormatErrorKind;
  /** Length of the rejected input. The raw value is never logged. */
  readonly inputLength: number;

  constructor(kind: TokenFormatErrorKind, message: string, inputLength: number) {
    super(kind, message, {
      hint: "Generate a fresh token via the auth library's createToken({...}) helper or the 'graphorin token create' CLI.",
    });
    this.kind = kind;
    this.inputLength = inputLength;
  }
}

/**
 * Raised when `parseScope(...)` rejects an input. Scope strings have a
 * deliberately small grammar (`<resource>:<action>[:<id-or-glob>]`) so
 * the parser never silently coerces malformed inputs into a default.
 *
 * @stable
 */
export class ScopeParseError extends GraphorinSecretsError {
  override readonly kind: 'scope-parse-error' = 'scope-parse-error';
  /** Original input string. Safe to log - never carries a secret. */
  readonly input: string;

  constructor(input: string, reason: string) {
    super('scope-parse-error', `Invalid scope '${input}': ${reason}`, {
      hint: "Use the '<resource>:<action>[:<id-or-glob>]' form. Resource and action are lowercase ASCII; the optional segment supports '*' as a glob or any UUID/slug.",
    });
    this.input = input;
  }
}

/**
 * Raised when `verifyToken(...)` is called from more concurrent in-
 * flight verifies than the configured cap allows. Used as a defensive
 * back-pressure signal under suspected DoS conditions; the HMAC verify
 * itself is too cheap to OOM the process, but a cap keeps log noise
 * and CPU contention bounded.
 *
 * @stable
 */
export class TokenVerifyOverloadError extends GraphorinSecretsError {
  override readonly kind: 'token-verify-overload' = 'token-verify-overload';
  readonly inFlight: number;
  readonly cap: number;

  constructor(inFlight: number, cap: number) {
    super(
      'token-verify-overload',
      `verifyToken refused: ${inFlight} concurrent verifies in-flight (cap = ${cap}).`,
      {
        hint: 'Raise maxConcurrentVerify or investigate the upstream caller - a healthy deployment never hits this cap.',
      },
    );
    this.inFlight = inFlight;
    this.cap = cap;
  }
}

/**
 * Raised when an IP or token has tripped the brute-force lockout. The
 * error carries the lockout source, the failing actor identifier, and
 * the wall-clock millisecond at which the lockout will lift.
 *
 * @stable
 */
export class TokenLockedOutError extends GraphorinSecretsError {
  override readonly kind: 'token-locked-out' = 'token-locked-out';
  readonly source: 'ip' | 'token';
  readonly identifier: string;
  readonly retryAfterMs: number;

  constructor(source: 'ip' | 'token', identifier: string, retryAfterMs: number) {
    super(
      'token-locked-out',
      `${source === 'ip' ? 'IP' : 'Token'} '${identifier}' is in lockout for ${Math.max(0, retryAfterMs)} ms.`,
      {
        hint:
          source === 'ip'
            ? 'Wait for the lockout window to elapse; investigate the source IP if the lockout repeats.'
            : "Revoke and re-issue the token via the auth library's revokeToken / rotateToken helpers (or 'graphorin token revoke'/'graphorin token rotate' once the CLI ships).",
      },
    );
    this.source = source;
    this.identifier = identifier;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Raised when `createToken` / `rekeyTokens` are
 * invoked with a pepper value that fails the strength check - either
 * below the 32-byte minimum, or a low-entropy / placeholder value
 * (e.g. a long run of identical bytes). See `assessSecretStrength`.
 *
 * @stable
 */
export class WeakPepperError extends GraphorinSecretsError {
  override readonly kind: 'weak-pepper' = 'weak-pepper';
  readonly providedBytes: number;

  constructor(providedBytes: number, reason?: string) {
    super(
      'weak-pepper',
      reason === undefined
        ? `Refused to install pepper: ${providedBytes} bytes is below the 32-byte minimum.`
        : `Refused to install pepper: ${reason}.`,
      {
        hint: "Generate a fresh pepper via 'crypto.randomBytes(32)' or use the auth library's generatePepper() helper.",
      },
    );
    this.providedBytes = providedBytes;
  }
}
