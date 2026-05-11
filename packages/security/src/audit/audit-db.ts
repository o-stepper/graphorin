/**
 * Audit database lifecycle. The framework intentionally separates the
 * audit log from the main store so that:
 *
 * - Encryption-at-rest is **mandatory** for the audit log even when
 *   the main store is unencrypted (the audit log carries attribution
 *   data — token id, route, IP hash — that must never sit at rest in
 *   plain bytes).
 * - The audit log can be archived, exported, and rotated on its own
 *   schedule.
 *
 * Concrete bindings live in dedicated packages (the SQLite-backed
 * binding ships from `@graphorin/store-sqlite` once Phase 05 lands).
 * The `@graphorin/security` package only owns the contract + the
 * registration plumbing so it does not pull a SQLite cipher binary
 * into every consumer of the secrets layer.
 *
 * @packageDocumentation
 */

import type { SecretValue } from '../secrets/secret-value.js';
import { AuditDbCipherUnavailableError } from './errors.js';
import type { StoredAuditEntry } from './types.js';

/**
 * Stored binding identifier. The framework default is the
 * `better-sqlite3-multiple-ciphers` package — registered by
 * `@graphorin/store-sqlite` at startup. Custom enterprise deployments
 * can register their own binding here without touching the secrets
 * layer.
 *
 * @stable
 */
export type AuditDbBindingId = 'better-sqlite3-multiple-ciphers' | (string & {});

/**
 * Options forwarded to a binding factory when `openAuditDb(...)` runs.
 *
 * @stable
 */
export interface OpenAuditDbOptions {
  /** Filesystem path to the audit database file. */
  readonly path: string;
  /** Passphrase used to derive the cipher key. */
  readonly passphrase: SecretValue;
  /** Cipher name. Defaults to the binding's preferred cipher. */
  readonly cipher?: string;
  /** Cipher-specific options. Forwarded verbatim to the binding. */
  readonly cipherOptions?: Readonly<Record<string, unknown>>;
  /** Identifier of the binding to use. Defaults to the default binding. */
  readonly binding?: AuditDbBindingId;
  /** Optional logger for warnings emitted during open. */
  readonly warn?: (message: string) => void;
}

/**
 * Shape of a registered binding. The factory is asynchronous so it
 * can perform the file-mode check, run the cipher self-test, and
 * write the `audit:db.opened` chain entry before returning.
 *
 * @stable
 */
export interface AuditDbBinding {
  /** Identifier of the binding. */
  readonly id: AuditDbBindingId;
  /** Human-readable description for diagnostics. */
  readonly description: string;
  /** Open the audit database. */
  readonly open: (options: OpenAuditDbOptions) => Promise<AuditDb>;
}

/**
 * Minimal audit-database surface consumed by the chain operations.
 * Concrete bindings can expose more, but the contract is intentionally
 * small so the verifier remains binding-agnostic.
 *
 * The methods are deliberately synchronous on the read path — the
 * single-file SQLite default is already in-process, and asynchrony
 * would add no I/O parallelism but would force every audit consumer
 * to plumb promise-state through hot loops.
 *
 * @stable
 */
export interface AuditDb {
  /** Stable identifier of the binding that produced this handle. */
  readonly binding: AuditDbBindingId;
  /** Path on disk. */
  readonly path: string;
  /** Append a new audit entry. The binding is responsible for atomicity. */
  readonly insert: (entry: StoredAuditEntry) => Promise<StoredAuditEntry>;
  /** Read the most-recent entry, used by `appendAudit` to compute `prev_hash`. */
  readonly latest: () => Promise<StoredAuditEntry | undefined>;
  /** Iterate stored entries in `seq` order. The optional bounds are inclusive. */
  readonly iterate: (bounds?: {
    readonly fromSeq?: number;
    readonly toSeq?: number;
  }) => AsyncIterable<StoredAuditEntry>;
  /** Total number of stored entries. */
  readonly count: () => Promise<number>;
  /** Delete entries with `seq <= threshold`. Used by `pruneAudit`. */
  readonly deleteUpTo: (threshold: number) => Promise<number>;
  /**
   * Replace a stored entry. The replacement preserves the `seq`
   * primary key and overwrites `prevHash` and `hash`. Used by
   * `pruneAudit` to root the surviving chain at the genesis prev-hash
   * and recompute the rolling chain hashes.
   */
  readonly replaceEntry: (entry: StoredAuditEntry) => Promise<void>;
  /** Close the underlying handle. */
  readonly close: () => Promise<void>;
}

const REGISTRY = new Map<AuditDbBindingId, AuditDbBinding>();
let DEFAULT_BINDING: AuditDbBindingId | undefined;

/**
 * Register a concrete binding. The framework default
 * (`better-sqlite3-multiple-ciphers`) is registered by
 * `@graphorin/store-sqlite`; downstream consumers can register a
 * custom binding before calling `openAuditDb(...)`.
 *
 * @stable
 */
export function registerAuditDbBinding(
  binding: AuditDbBinding,
  opts: { readonly setAsDefault?: boolean } = {},
): () => void {
  REGISTRY.set(binding.id, binding);
  if (opts.setAsDefault === true || DEFAULT_BINDING === undefined) {
    DEFAULT_BINDING = binding.id;
  }
  return () => {
    REGISTRY.delete(binding.id);
    if (DEFAULT_BINDING === binding.id) DEFAULT_BINDING = undefined;
  };
}

/**
 * Snapshot of the binding registry. Used by `graphorin doctor` once
 * the CLI ships.
 *
 * @stable
 */
export function listAuditDbBindings(): ReadonlyArray<{
  readonly id: AuditDbBindingId;
  readonly description: string;
  readonly isDefault: boolean;
}> {
  return Object.freeze(
    [...REGISTRY.values()].map((b) =>
      Object.freeze({
        id: b.id,
        description: b.description,
        isDefault: b.id === DEFAULT_BINDING,
      }),
    ),
  );
}

/**
 * Read the identifier of the active default binding. Returns
 * `undefined` if no binding has been registered.
 *
 * @stable
 */
export function getDefaultAuditDbBinding(): AuditDbBindingId | undefined {
  return DEFAULT_BINDING;
}

/**
 * Reset the registry. Tests use this between cases.
 *
 * @experimental
 */
export function _resetAuditDbBindingsForTesting(): void {
  REGISTRY.clear();
  DEFAULT_BINDING = undefined;
}

/**
 * Open an audit database. The function fails fast with
 * `AuditDbCipherUnavailableError` when no binding is registered, or
 * when the requested binding identifier is unknown.
 *
 * @stable
 */
export async function openAuditDb(options: OpenAuditDbOptions): Promise<AuditDb> {
  const requested = options.binding ?? DEFAULT_BINDING;
  if (requested === undefined) {
    throw new AuditDbCipherUnavailableError(
      'default',
      'Audit log requires an encrypted SQLite binding but none has been registered. Install or import @graphorin/store-sqlite (Phase 05) so it can register the default binding.',
    );
  }
  const binding = REGISTRY.get(requested);
  if (binding === undefined) {
    throw new AuditDbCipherUnavailableError(requested);
  }
  const handle = await binding.open(options);
  return handle;
}
