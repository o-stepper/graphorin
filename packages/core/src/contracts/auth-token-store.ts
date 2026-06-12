/**
 * Persisted server auth token record. Holds a per-token HMAC hash + scope
 * grammar; raw tokens are never persisted (the runtime carries them via
 * `SecretValue`).
 *
 * @stable
 */
export interface AuthTokenRecord {
  /** Stable identifier (the public part of the token, before the secret). */
  readonly id: string;
  /** HMAC-SHA256 of the secret part, peppered. Hex-encoded. */
  readonly hashHex: string;
  /** Optional human-readable label rendered in CLI listings. */
  readonly label?: string;
  /** Scope grammar — opaque strings of the form `<resource>:<action>[:<id-or-glob>]`. */
  readonly scopes: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly revokedAt?: string;
  readonly lastUsedAt?: string;
}

/**
 * Pluggable storage for server auth tokens. The default implementation
 * lives in `@graphorin/store-sqlite` (`auth_tokens` table). The server
 * package implements `verifyToken(...)` on top of this contract.
 *
 * @stable
 */
export interface AuthTokenStore {
  put(record: AuthTokenRecord): Promise<void>;
  get(id: string): Promise<AuthTokenRecord | null>;
  list(): Promise<ReadonlyArray<AuthTokenRecord>>;
  revoke(id: string, revokedAt: string): Promise<void>;
  recordUse(id: string, usedAt: string): Promise<void>;
  /**
   * Indexed lookup by HMAC hash (SPL-19). When present, the verifier
   * uses it on cache-miss instead of walking `list()` — O(1) instead of
   * an O(n) full-table scan per verification.
   */
  getByHash?(hashHex: string): Promise<AuthTokenRecord | null>;
}
