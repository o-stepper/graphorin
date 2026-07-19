/**
 * Typed error surface for `@graphorin/server`. Every server-side
 * configuration / lifecycle / runtime failure that an operator must
 * be able to reason about flows through one of the classes in this
 * module so it carries a stable `kind` discriminator + `hint` field
 * pointing the operator at the next remediation step.
 *
 * @packageDocumentation
 */

/**
 * Stable string discriminator for {@link GraphorinServerError}. Each
 * value maps to a single failure scenario; never reuse a value for a
 * different cause.
 *
 * @stable
 */
export type GraphorinServerErrorCode =
  | 'config-invalid'
  | 'pre-bind-pepper-missing'
  | 'pre-bind-secret-unresolvable'
  | 'pre-bind-encryption-peer-missing'
  | 'pre-bind-encryption-required'
  | 'migration-failed'
  | 'shutdown-timeout'
  | 'idempotency-conflict'
  | 'idempotency-key-required'
  | 'auth-required'
  | 'auth-invalid'
  | 'auth-revoked'
  | 'auth-expired'
  | 'auth-locked-out'
  | 'auth-overloaded'
  | 'scope-denied'
  | 'csrf-denied'
  | 'cors-denied'
  | 'rate-limit-exceeded'
  | 'route-handler-missing'
  | 'agent-not-found'
  | 'workflow-not-found'
  | 'session-not-found'
  | 'run-not-found'
  | 'run-aborted'
  | 'lifecycle-double-start'
  | 'lifecycle-not-started';

/**
 * Base error class. Every server-emitted typed error inherits from
 * here so middleware can pattern-match a single union.
 *
 * @stable
 */
export class GraphorinServerError extends Error {
  readonly kind: GraphorinServerErrorCode;
  readonly hint?: string;

  constructor(
    kind: GraphorinServerErrorCode,
    message: string,
    options?: { readonly cause?: unknown; readonly hint?: string },
  ) {
    super(
      message,
      options !== undefined && options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = this.constructor.name;
    this.kind = kind;
    if (options?.hint !== undefined) this.hint = options.hint;
  }
}

/** @stable */
export class ConfigInvalidError extends GraphorinServerError {
  readonly issues: ReadonlyArray<{
    readonly path: ReadonlyArray<string | number>;
    readonly message: string;
  }>;

  constructor(
    issues: ReadonlyArray<{
      readonly path: ReadonlyArray<string | number>;
      readonly message: string;
    }>,
    cause?: unknown,
  ) {
    super('config-invalid', `graphorin.config invalid: ${issues.length} issue(s)`, {
      hint: 'Inspect the issues array; each entry pinpoints the offending path.',
      ...(cause !== undefined ? { cause } : {}),
    });
    this.issues = Object.freeze(issues.slice());
  }
}

/** @stable */
export class PrebindPepperMissingError extends GraphorinServerError {
  constructor() {
    super(
      'pre-bind-pepper-missing',
      'auth.pepper SecretRef did not resolve to a non-empty pepper.',
      {
        hint: 'Run `graphorin doctor --check-secrets` and verify the configured SecretRef.',
      },
    );
  }
}

/** @stable */
export class PrebindSecretUnresolvableError extends GraphorinServerError {
  readonly path: ReadonlyArray<string | number>;
  readonly raw: string;

  constructor(path: ReadonlyArray<string | number>, raw: string, cause?: unknown) {
    super(
      'pre-bind-secret-unresolvable',
      `Could not resolve SecretRef '${raw}' at config path ${path.join('.')}`,
      {
        hint: 'Run `graphorin doctor --check-secrets` and verify the configured SecretRef.',
        ...(cause !== undefined ? { cause } : {}),
      },
    );
    this.path = Object.freeze(path.slice());
    this.raw = raw;
  }
}

/** @stable */
export class PrebindEncryptionPeerMissingError extends GraphorinServerError {
  constructor(cause?: unknown) {
    super(
      'pre-bind-encryption-peer-missing',
      'storage.encryption.enabled = true but the cipher peer is not installed.',
      {
        hint: "Install the 'better-sqlite3-multiple-ciphers' peer (or set storage.encryption.enabled = false).",
        ...(cause !== undefined ? { cause } : {}),
      },
    );
  }
}

/** @stable */
export class PrebindEncryptionRequiredError extends GraphorinServerError {
  constructor(reason: string) {
    super('pre-bind-encryption-required', reason, {
      hint: 'Audit logs are mandatory-encrypted (DEC-124); enable storage.encryption or supply audit.encryption explicitly.',
    });
  }
}

/** @stable */
export class MigrationFailedError extends GraphorinServerError {
  constructor(message: string, cause?: unknown) {
    super('migration-failed', message, {
      hint: 'Inspect the underlying SQLite error and re-run `graphorin migrate`.',
      ...(cause !== undefined ? { cause } : {}),
    });
  }
}

/** @stable */
export class ShutdownTimeoutError extends GraphorinServerError {
  readonly drainTimeoutMs: number;
  readonly inflight: number;

  constructor(drainTimeoutMs: number, inflight: number) {
    super(
      'shutdown-timeout',
      `Drain timed out after ${drainTimeoutMs}ms with ${inflight} request(s) still in flight.`,
      {
        hint: 'Increase server.shutdown.drainTimeoutMs or fix slow handlers.',
      },
    );
    this.drainTimeoutMs = drainTimeoutMs;
    this.inflight = inflight;
  }
}

/** @stable */
export class IdempotencyConflictError extends GraphorinServerError {
  constructor(key: string) {
    super(
      'idempotency-conflict',
      `Idempotency-Key '${key}' was previously used with a different request body.`,
      {
        hint: 'Generate a fresh Idempotency-Key for the new payload.',
      },
    );
  }
}

/** @stable */
export class IdempotencyKeyRequiredError extends GraphorinServerError {
  constructor() {
    super(
      'idempotency-key-required',
      'Side-effecting endpoint requires an Idempotency-Key header.',
      {
        hint: "Set 'Idempotency-Key: <uuid>' on the request, or relax server.idempotency.requireKey to 'warn'.",
      },
    );
  }
}

/** @stable */
export class LifecycleDoubleStartError extends GraphorinServerError {
  constructor() {
    super('lifecycle-double-start', 'Server.start() invoked while the server is already started.', {
      hint: 'Call stop() before re-starting the server.',
    });
  }
}

/** @stable */
export class LifecycleNotStartedError extends GraphorinServerError {
  constructor() {
    super('lifecycle-not-started', 'Server.stop() invoked before start() resolved.', {
      hint: 'Await start() before calling stop().',
    });
  }
}

/** @stable */
export class RouteHandlerMissingError extends GraphorinServerError {
  readonly id: string;
  readonly kind_: 'agent' | 'workflow';

  constructor(kind: 'agent' | 'workflow', id: string) {
    super('route-handler-missing', `No ${kind} registered with id '${id}'.`, {
      hint: `Register the ${kind} via createServer({ ${kind}s: { ... } }) or the AgentRegistry / WorkflowRegistry surface.`,
    });
    this.id = id;
    this.kind_ = kind;
  }
}

/** @stable */
export class AgentNotFoundError extends RouteHandlerMissingError {
  constructor(id: string) {
    super('agent', id);
  }
}

/** @stable */
export class WorkflowNotFoundError extends RouteHandlerMissingError {
  constructor(id: string) {
    super('workflow', id);
  }
}
