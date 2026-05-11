/**
 * Typed errors raised by the sandbox dispatcher and the four built-in
 * adapters. Every error subclasses `GraphorinSecretsError` (the
 * package-wide base) so callers can keep a single `instanceof` check
 * at module boundaries.
 *
 * @packageDocumentation
 */

import { GraphorinSecretsError } from '../secrets/errors.js';

/**
 * Generic base for sandbox-specific errors. Carries `kind` for
 * structured error handling.
 *
 * @stable
 */
export abstract class GraphorinSandboxError extends GraphorinSecretsError {}

/**
 * Raised when the sandbox dispatcher receives a `SandboxKind` it
 * cannot satisfy and the resolver is configured to fail fast.
 *
 * @stable
 */
export class UnsupportedSandboxKindError extends GraphorinSandboxError {
  override readonly kind: 'unsupported-sandbox-kind' = 'unsupported-sandbox-kind';
  /** The kind the dispatcher could not satisfy. */
  readonly requested: string;
  /** The kinds the dispatcher knows about. */
  readonly available: ReadonlyArray<string>;
  constructor(requested: string, available: ReadonlyArray<string>) {
    super(
      'unsupported-sandbox-kind',
      `unsupported sandbox kind: ${requested}; available kinds: ${[...available].join(', ') || '(none registered)'}`,
    );
    this.requested = requested;
    this.available = Object.freeze([...available]);
  }
}

/**
 * Raised when the optional native peer dependency required by an
 * adapter (e.g. `isolated-vm`, `dockerode`) is not installed.
 *
 * @stable
 */
export class SandboxPeerUnavailableError extends GraphorinSandboxError {
  override readonly kind: 'sandbox-peer-unavailable' = 'sandbox-peer-unavailable';
  /** Adapter that requested the peer. */
  readonly adapter: string;
  /** npm package name that was missing. */
  readonly peer: string;
  /** Verbatim install command shown to operators. */
  readonly installCommand: string;
  constructor(
    adapter: string,
    peer: string,
    installCommand: string,
    options?: { cause?: unknown },
  ) {
    super(
      'sandbox-peer-unavailable',
      `${adapter} requires the optional peer dependency ${peer}, which is not installed.`,
      { hint: installCommand, ...(options?.cause === undefined ? {} : { cause: options.cause }) },
    );
    this.adapter = adapter;
    this.peer = peer;
    this.installCommand = installCommand;
  }
}

/**
 * Raised by `resolveSandbox(...)` consumers that opt into strict
 * enforcement when the operator supplies a custom policy that
 * violates a mandatory tier (e.g. trying to set `sandboxPolicy:
 * 'none'` on an untrusted skill tool).
 *
 * @stable
 */
export class MandatorySandboxOverrideError extends GraphorinSandboxError {
  override readonly kind: 'mandatory-sandbox-override' = 'mandatory-sandbox-override';
  readonly tier: string;
  readonly attempted: string;
  readonly mandated: string;
  constructor(tier: string, attempted: string, mandated: string) {
    super(
      'mandatory-sandbox-override',
      `the ${tier} trust tier mandates the ${mandated} sandbox; cannot override to ${attempted}`,
    );
    this.tier = tier;
    this.attempted = attempted;
    this.mandated = mandated;
  }
}

/**
 * Raised when a sandboxed run is rejected because the resolved
 * filesystem policy is `noFilesystem: true` and the executed code
 * tried to access the filesystem.
 *
 * @stable
 */
export class SandboxFsAccessDeniedError extends GraphorinSandboxError {
  override readonly kind: 'sandbox-fs-access-denied' = 'sandbox-fs-access-denied';
  readonly attemptedPath?: string;
  constructor(attemptedPath?: string) {
    super(
      'sandbox-fs-access-denied',
      attemptedPath
        ? `filesystem access denied by sandbox policy: ${attemptedPath}`
        : 'filesystem access denied by sandbox policy',
    );
    if (attemptedPath !== undefined) this.attemptedPath = attemptedPath;
  }
}

/**
 * Raised when a sandboxed run is rejected because the resolved
 * network policy is `noNetwork: true` and the executed code tried to
 * make an outbound request.
 *
 * @stable
 */
export class SandboxNetworkAccessDeniedError extends GraphorinSandboxError {
  override readonly kind: 'sandbox-network-access-denied' = 'sandbox-network-access-denied';
  readonly attemptedHost?: string;
  constructor(attemptedHost?: string) {
    super(
      'sandbox-network-access-denied',
      attemptedHost
        ? `network access denied by sandbox policy: ${attemptedHost}`
        : 'network access denied by sandbox policy',
    );
    if (attemptedHost !== undefined) this.attemptedHost = attemptedHost;
  }
}
