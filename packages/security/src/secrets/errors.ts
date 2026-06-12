/**
 * Typed error classes raised by the secrets layer of `@graphorin/security`.
 *
 * Every error carries a stable lowercase `kind` so downstream code can
 * branch without parsing messages, plus a `hint` field that points at a
 * remediation step (CLI command or doc reference) where appropriate.
 *
 * @packageDocumentation
 */

/**
 * Base class for every error thrown by the secrets layer. Carries a
 * stable `kind` discriminator and optional `hint`.
 *
 * @stable
 */
export class GraphorinSecretsError extends Error {
  /** Stable lowercase discriminator. Subclasses fix this to a literal. */
  readonly kind: string;
  /** Optional remediation hint (CLI command or doc link). */
  readonly hint?: string;

  constructor(kind: string, message: string, options?: { cause?: unknown; hint?: string }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;
    this.kind = kind;
    if (options?.hint !== undefined) this.hint = options.hint;
  }
}

/**
 * Discriminator union for `SecretRefParseError`. Lets callers branch on
 * the failure mode without parsing the message string.
 *
 * @stable
 */
export type SecretRefParseErrorKind =
  | 'empty-input'
  | 'malformed-uri'
  | 'invalid-scheme'
  | 'unknown-scheme'
  | 'missing-authority'
  | 'unexpected-authority'
  | 'empty-path'
  | 'invalid-percent-encoding'
  | 'naked-string';

/**
 * Raised when `parseSecretRef(...)` rejects an input. The parser is
 * strict-by-default and never silently falls through to a default
 * resolver — typos in `*Ref` config fields surface here at bootstrap.
 *
 * @stable
 */
export class SecretRefParseError extends GraphorinSecretsError {
  override readonly kind: SecretRefParseErrorKind;
  /** Original input string. Safe to log — never carries a secret value (naked-string inputs are stored REDACTED: 4-char head + length). */
  readonly input: string;
  /** Optional offset into `input` where the parser stopped. */
  readonly position?: number;

  constructor(
    kind: SecretRefParseErrorKind,
    message: string,
    input: string,
    position?: number,
    options?: { cause?: unknown; hint?: string },
  ) {
    super(kind, message, options);
    this.kind = kind;
    this.input = input;
    if (position !== undefined) this.position = position;
  }
}

/**
 * Raised by the resolver dispatcher when no resolver is registered for
 * the parsed scheme. Suggests `registerResolver(...)` as the fix.
 *
 * @stable
 */
export class UnknownSchemeError extends GraphorinSecretsError {
  override readonly kind: 'unknown-scheme' = 'unknown-scheme';
  /** Lowercased scheme that failed lookup. */
  readonly scheme: string;
  /** Original ref input — safe to log. */
  readonly ref: string;

  constructor(scheme: string, ref: string) {
    super('unknown-scheme', `No resolver is registered for scheme '${scheme}' (ref: '${ref}')`, {
      hint: 'Register a resolver via registerResolver({ scheme, resolve }) before bootstrap, or use one of the built-in schemes: env, keyring, file, encrypted-file, literal, ref, vault.',
    });
    this.scheme = scheme;
    this.ref = ref;
  }
}

/**
 * Raised by `resolveSecret(...)` when a resolver matched the scheme but
 * returned `null` (resolved to "not found").
 *
 * @stable
 */
export class SecretResolutionError extends GraphorinSecretsError {
  override readonly kind: 'resolution-failed' = 'resolution-failed';
  /** Lowercased scheme that ran. */
  readonly scheme: string;
  /** Original ref input — safe to log. */
  readonly ref: string;

  constructor(scheme: string, ref: string, reason: string, options?: { cause?: unknown }) {
    super('resolution-failed', `Failed to resolve '${ref}' (scheme '${scheme}'): ${reason}`, {
      cause: options?.cause,
      hint: "Run 'graphorin doctor --check-secrets' to diagnose the active SecretsStore chain.",
    });
    this.scheme = scheme;
    this.ref = ref;
  }
}

/**
 * Raised when a `literal:` ref is encountered without all three gates
 * (env flag + config flag + non-production NODE_ENV with a special
 * override) being satisfied.
 *
 * @stable
 */
export class LiteralSecretsForbiddenError extends GraphorinSecretsError {
  override readonly kind: 'literal-secrets-forbidden' = 'literal-secrets-forbidden';

  constructor(reason: string) {
    super('literal-secrets-forbidden', `Refused to resolve literal: secret — ${reason}`, {
      hint: "Use a 'keyring:' or 'encrypted-file:' SecretRef instead. The 'literal:' scheme is gated for tests only and requires GRAPHORIN_ALLOW_LITERAL_SECRETS=1 plus secrets.allowLiteral=true in code, and is forbidden in NODE_ENV=production unless GRAPHORIN_ALLOW_LITERAL_SECRETS_IN_PRODUCTION=1 is also set (deliberately discouraged).",
    });
  }
}

/**
 * Raised by `SecretsStore.require(...)` when the requested key is not
 * present in the active store.
 *
 * @stable
 */
export class SecretRequiredError extends GraphorinSecretsError {
  override readonly kind: 'secret-required' = 'secret-required';
  /** The secret key that was missing. Safe to log. */
  readonly key: string;

  constructor(key: string) {
    super('secret-required', `Required secret '${key}' was not found in the active SecretsStore.`, {
      hint: `Set the value first: graphorin secrets set ${key}`,
    });
    this.key = key;
  }
}

/**
 * Raised when a tool calls `ctx.secrets.require(key)` with a key that
 * is not in its declared `secretsAllowed` allowlist.
 *
 * @stable
 */
export class SecretAccessDeniedError extends GraphorinSecretsError {
  override readonly kind: 'secret-access-denied' = 'secret-access-denied';
  /** The denied secret key. */
  readonly key: string;
  /** Tool that issued the request. */
  readonly toolName: string;
  /** Snapshot of the currently-effective allowlist. */
  readonly allowedSet: ReadonlyArray<string>;

  constructor(key: string, toolName: string, allowedSet: ReadonlyArray<string>) {
    super(
      'secret-access-denied',
      `Tool '${toolName}' is not allowed to access secret '${key}' (missing from secretsAllowed).`,
      {
        hint: `Add '${key}' to the tool's secretsAllowed list, or rotate the secret behind a different key.`,
      },
    );
    this.key = key;
    this.toolName = toolName;
    this.allowedSet = Object.freeze([...allowedSet]);
  }
}

/**
 * Raised by `MemorySecretsStore` when constructed in a production-mode
 * process without the explicit `forceProduction` opt-out.
 *
 * @stable
 */
export class MemoryStoreInProductionError extends GraphorinSecretsError {
  override readonly kind: 'memory-store-in-production' = 'memory-store-in-production';

  constructor() {
    super(
      'memory-store-in-production',
      "MemorySecretsStore refused to start because NODE_ENV='production'.",
      {
        hint: "MemorySecretsStore is intended for tests only. Use createSecretsStore({ kind: 'auto' }) or pass { forceProduction: true } if you really mean to run an ephemeral in-memory store in production.",
      },
    );
  }
}

/**
 * Raised by the factory when `--strict-secrets` is set and the requested
 * primary store is unavailable on the current host.
 *
 * @stable
 */
export class StrictSecretsUnavailableError extends GraphorinSecretsError {
  override readonly kind: 'strict-secrets-unavailable' = 'strict-secrets-unavailable';
  /** Identifier of the source that was requested. */
  readonly source: string;
  /** Reasons the store could not be activated. */
  readonly reasons: ReadonlyArray<string>;

  constructor(source: string, reasons: ReadonlyArray<string>) {
    super(
      'strict-secrets-unavailable',
      `--strict-secrets requested SecretsStore '${source}' but it is unavailable on this host.`,
      {
        hint: 'Either install the missing peer dependency / unlock the keyring, or remove --strict-secrets to allow the configured fallback chain.',
      },
    );
    this.source = source;
    this.reasons = Object.freeze([...reasons]);
  }
}

/**
 * Raised when an optional native peer dependency required by a
 * `SecretsStore` (e.g. `@napi-rs/keyring`, `@node-rs/argon2`) is missing.
 *
 * @stable
 */
export class MissingPeerDependencyError extends GraphorinSecretsError {
  override readonly kind: 'missing-peer-dependency' = 'missing-peer-dependency';
  /** npm package name that was missing. */
  readonly packageName: string;

  constructor(packageName: string, used_by: string, options?: { cause?: unknown }) {
    super(
      'missing-peer-dependency',
      `Missing optional peer dependency '${packageName}' (required by ${used_by}).`,
      {
        cause: options?.cause,
        hint: `Install it with: pnpm add ${packageName}`,
      },
    );
    this.packageName = packageName;
  }
}
