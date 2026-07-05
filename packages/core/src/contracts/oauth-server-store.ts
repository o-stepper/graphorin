/**
 * Persisted metadata for an OAuth server registration. The framework
 * never stores raw token material here - the access, refresh, id, and
 * client-secret tokens live in the {@link SecretsStore} and this
 * record only holds the {@link SecretRef} URIs that resolve them.
 *
 * Schema mirrors the canonical `oauth_servers` SQLite table provided
 * by `@graphorin/store-sqlite`.
 *
 * @stable
 */
export interface OAuthServerRecord {
  /** Stable, human-readable identifier (e.g. `'linear-mcp'`). */
  readonly id: string;
  /** Base URL of the OAuth-protected resource server (e.g. MCP endpoint). */
  readonly serverUrl: string;
  /** Authorization-server `authorization_endpoint`. */
  readonly authorizationEndpoint?: string;
  /** Authorization-server `token_endpoint`. */
  readonly tokenEndpoint?: string;
  /** Authorization-server `registration_endpoint` (RFC 7591). */
  readonly registrationEndpoint?: string;
  /** Authorization-server `revocation_endpoint` (RFC 7009). */
  readonly revocationEndpoint?: string;
  /** Authorization-server `device_authorization_endpoint` (RFC 8628). */
  readonly deviceAuthorizationEndpoint?: string;
  /** Issuer identifier reported in the discovery response. */
  readonly issuer?: string;
  /** Public client identifier; safe to log. */
  readonly clientId: string;
  /** {@link SecretRef} URI for the confidential-client secret. */
  readonly clientSecretRef?: string;
  /** {@link SecretRef} URI for the access token. */
  readonly accessTokenRef?: string;
  /** {@link SecretRef} URI for the refresh token. */
  readonly refreshTokenRef?: string;
  /** {@link SecretRef} URI for the OIDC ID token. */
  readonly idTokenRef?: string;
  /** Epoch milliseconds when the access token stops being valid. */
  readonly expiresAt?: number;
  /** Granted scopes (space-separated string per the OAuth spec). */
  readonly scope?: string;
  /** Redirect URI that was used during the most recent code flow. */
  readonly redirectUri?: string;
  /** Whether the client was registered via Dynamic Client Registration. */
  readonly registeredVia?: 'dcr' | 'manual';
  /** Epoch milliseconds of the last successful refresh. */
  readonly lastRefreshedAt?: number;
  /** Last error string captured from a failing refresh attempt. */
  readonly lastRefreshError?: string;
  /** Epoch milliseconds when the record was first created. */
  readonly createdAt: number;
  /** Epoch milliseconds when the record was last updated. */
  readonly updatedAt: number;
}

/**
 * Pluggable storage for OAuth server registrations + token metadata.
 *
 * The default implementation lives in `@graphorin/store-sqlite`
 * (`oauth_servers` table). `@graphorin/security` ships an in-memory
 * implementation that callers can use until the SQLite-backed store
 * is wired up.
 *
 * @stable
 */
export interface OAuthServerStore {
  /** Insert or replace the record for `id`. */
  put(record: OAuthServerRecord): Promise<void>;
  /** Read the record for `id`, returning `null` when absent. */
  get(id: string): Promise<OAuthServerRecord | null>;
  /** Snapshot of all stored records, ordered by `id`. */
  list(): Promise<ReadonlyArray<OAuthServerRecord>>;
  /** Apply a partial update to the record at `id`. */
  update(id: string, patch: Partial<OAuthServerRecord>): Promise<OAuthServerRecord>;
  /** Remove the record for `id`. */
  delete(id: string): Promise<void>;
}
