import type { SessionScope } from '../types/session-scope.js';
import type { SecretRef } from './secret-ref.js';
import type { SecretValue } from './secret-value.js';

/**
 * Pluggable secret resolver - turns a parsed `SecretRef` into a live
 * `SecretValue`. Concrete resolvers live in `@graphorin/security` (env,
 * keyring, file, encrypted-file, literal, ref, vault) and in optional
 * adapter packages (`@graphorin/secret-1password`, …).
 *
 * @stable
 */
export interface SecretResolver {
  /** Lowercased URI scheme handled by this resolver (`'env'`, `'op'`, …). */
  readonly scheme: string;
  resolve(ref: SecretRef, ctx?: SecretResolverContext): Promise<SecretValue>;
}

/**
 * Optional context handed to a resolver. Carries the originating tool /
 * agent identifiers so the audit log can attribute the resolution.
 *
 * @stable
 */
export interface SecretResolverContext {
  readonly toolName?: string;
  readonly agentId?: string;
  readonly runId?: string;
  readonly signal?: AbortSignal;
}

/**
 * Pluggable secret-managing storage. Concrete implementations live in
 * `@graphorin/security` (`KeyringSecretsStore`, `EncryptedFileSecretsStore`,
 * `EnvSecretsStore`, `MemorySecretsStore`).
 *
 * The interface is intentionally narrow: every method either returns a
 * `SecretValue` or a piece of metadata that is safe to log. The raw
 * value is never returned as a `string` from this surface.
 *
 * @stable
 */
export interface SecretsStore {
  /** Returns the secret if it exists, `null` otherwise. */
  get(key: string, scope?: SessionScope): Promise<SecretValue | null>;

  /**
   * Returns the secret or throws. Implementations enforce the per-tool
   * `secretsAllowed` ACL: if the current tool context disallows `key`,
   * throw `SecretAccessDeniedError`.
   */
  require(key: string, scope?: SessionScope): Promise<SecretValue>;

  /**
   * Persist a secret. Implementations auto-wrap a plain string into a
   * `SecretValue` so callers don't have to.
   */
  set(key: string, value: string | SecretValue, opts?: SecretsSetOptions): Promise<void>;

  delete(key: string, scope?: SessionScope): Promise<void>;

  /** Returns metadata about every key - never the values themselves. */
  list(scope?: SessionScope): Promise<ReadonlyArray<SecretMetadata>>;
}

/**
 * Optional knobs for `SecretsStore.set(...)`.
 *
 * @stable
 */
export interface SecretsSetOptions {
  readonly scope?: SessionScope;
  readonly expiresAt?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Public metadata about a stored secret. Safe to log - never carries the
 * value itself.
 *
 * @stable
 */
export interface SecretMetadata {
  readonly key: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly expiresAt?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly source?: string;
}
