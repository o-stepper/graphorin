/**
 * Typed errors raised by the audit-log surface of `@graphorin/security`.
 *
 * @packageDocumentation
 */

import { GraphorinSecretsError } from '../secrets/errors.js';

/**
 * Raised by `openAuditDb(...)` when no encrypted-SQLite binding has
 * been registered. The audit log mandates encryption-at-rest; the
 * library refuses to silently downgrade to a plaintext SQLite handle.
 *
 * @stable
 */
export class AuditDbCipherUnavailableError extends GraphorinSecretsError {
  override readonly kind: 'audit-db-cipher-unavailable' = 'audit-db-cipher-unavailable';
  /** Identifier of the binding that was requested. */
  readonly binding: string;
  /** Verbatim install command that resolves the missing binding. */
  readonly installCommand: string =
    'pnpm add @graphorin/store-sqlite better-sqlite3-multiple-ciphers';

  constructor(binding: string, message?: string) {
    super(
      'audit-db-cipher-unavailable',
      message ??
        `Audit log requires an encrypted SQLite binding (requested '${binding}') but none is registered.`,
      {
        hint: 'Install the SQLite-backed binding via `pnpm add @graphorin/store-sqlite better-sqlite3-multiple-ciphers`, or call registerAuditDbBinding(...) with a custom encrypted-SQLite implementation. The audit log never silently downgrades to a plaintext SQLite handle.',
      },
    );
    this.binding = binding;
  }
}

/**
 * Raised by `verifyAuditChain(...)` when the chain is found to be
 * broken. The error carries the first divergent sequence number plus
 * the expected and actual hash values for forensic analysis.
 *
 * @stable
 */
export class AuditChainBrokenError extends GraphorinSecretsError {
  override readonly kind: 'audit-chain-broken' = 'audit-chain-broken';
  readonly seq: number;
  readonly expectedHash: string;
  readonly actualHash: string;

  constructor(seq: number, expectedHash: string, actualHash: string) {
    super(
      'audit-chain-broken',
      `Audit chain broken at seq ${seq}: expected '${expectedHash}' but stored hash is '${actualHash}'.`,
      {
        hint: "Run 'graphorin audit verify' to walk the entire chain and surface every break (the CLI reports the first break only).",
      },
    );
    this.seq = seq;
    this.expectedHash = expectedHash;
    this.actualHash = actualHash;
  }
}

/**
 * Raised when an audit log payload fails canonical-JSON
 * serialization (e.g. cyclic references, BigInt, or other
 * non-serialisable values).
 *
 * @stable
 */
export class AuditPayloadSerializationError extends GraphorinSecretsError {
  override readonly kind: 'audit-payload-serialization' = 'audit-payload-serialization';

  constructor(reason: string) {
    super('audit-payload-serialization', `Audit payload is not serialisable: ${reason}.`, {
      hint: 'Audit payload metadata must be a JSON-compatible record (no BigInt, cyclic references, undefined values, or class instances). Stringify hashes/values before passing.',
    });
  }
}
