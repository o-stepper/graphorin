/**
 * Public types for the outbound OAuth subsystem.
 *
 * The framework supports three flows out of the box:
 *
 * - **Authorization Code + PKCE** with a localhost callback (default
 *   for desktop / CLI usage; per RFC 7636 + RFC 6749).
 * - **Device Authorization Grant** (RFC 8628; opt-in for SSH /
 *   headless deployments without a usable browser).
 * - **Dynamic Client Registration** (RFC 7591; resolved automatically
 *   from the discovered authorization-server metadata).
 *
 * Refresh-token rotation, debounced refresh, revocation lifecycle and
 * the audit-log integration are documented in the sibling modules.
 *
 * @packageDocumentation
 */

import type { SecretValue } from '../secrets/secret-value.js';

/**
 * Discovered authorization-server metadata. A subset of RFC 8414 +
 * the OpenID Connect discovery surface. Fields the framework does
 * not use are intentionally elided.
 *
 * @stable
 */
export interface OAuthServerMetadata {
  readonly issuer: string;
  readonly authorizationEndpoint: string;
  readonly tokenEndpoint: string;
  readonly registrationEndpoint?: string;
  readonly revocationEndpoint?: string;
  readonly deviceAuthorizationEndpoint?: string;
  readonly userinfoEndpoint?: string;
  readonly jwksUri?: string;
  readonly scopesSupported?: ReadonlyArray<string>;
  readonly responseTypesSupported?: ReadonlyArray<string>;
  readonly grantTypesSupported?: ReadonlyArray<string>;
  readonly codeChallengeMethodsSupported?: ReadonlyArray<string>;
  /** Original discovery payload, captured for diagnostics. */
  readonly raw?: Readonly<Record<string, unknown>>;
}

/**
 * Discovered protected-resource metadata (RFC 9728). Returned by the
 * `${resourceUrl}/.well-known/oauth-protected-resource` endpoint.
 *
 * @stable
 */
export interface ProtectedResourceMetadata {
  readonly resource: string;
  readonly authorizationServers: ReadonlyArray<string>;
  readonly bearerMethodsSupported?: ReadonlyArray<string>;
  readonly resourceDocumentation?: string;
  readonly raw?: Readonly<Record<string, unknown>>;
}

/**
 * Result of running the discovery pipeline. Either the protected
 * resource metadata produced an authorization-server URL we then
 * fetched, or we discovered the authorization-server directly.
 *
 * @stable
 */
export interface DiscoveredMetadata {
  readonly server: OAuthServerMetadata;
  readonly resource?: ProtectedResourceMetadata;
}

/**
 * Configuration options for `createOAuthClient(...)`.
 *
 * @stable
 */
export interface CreateOAuthClientOptions {
  /** Stable identifier; persisted into the {@link OAuthServerStore}. */
  readonly serverId: string;
  /** Base URL of the OAuth-protected resource server. */
  readonly serverUrl: string;
  /** Stored / persistent registration metadata. */
  readonly registration?: OAuthRegistration;
  /** Persistent storage for the registration + token-ref metadata. */
  readonly storage: import('@graphorin/core/contracts').OAuthServerStore;
  /**
   * Secrets store the actual tokens are persisted into (SPL-1). When
   * supplied, `persistSession` writes the access / refresh / id tokens
   * under the `oauth:<serverId>:<kind>` keys the record's refs point
   * at, and refresh / revoke / status resolve them back - so sessions
   * survive process restarts. Without it, tokens live only in process
   * memory (the pre-SPL-1 behavior, documented).
   */
  readonly secretsStore?: import('@graphorin/core/contracts').SecretsStore;
  /**
   * Refresh-ahead window in ms. On the client itself this only colours
   * `status()` labels (`'expiring-soon'`); the proactive refresh that
   * uses the window lives in the MCP bridge's authorization provider
   * (`createOAuthAuthorizationProvider`), which refreshes when the
   * persisted expiry is within its own `refreshAheadMs` (SPL-12).
   */
  readonly refreshAheadMs?: number;
  /** Optional pre-discovered metadata (skip the network round-trip). */
  readonly metadata?: DiscoveredMetadata;
  /** Optional logger. */
  readonly logger?: (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    fields?: Record<string, unknown>,
  ) => void;
}

/**
 * Pre-registered OAuth client identifier and (optional) confidential
 * client secret. Skipping this triggers Dynamic Client Registration
 * the first time the client opens an authorization flow.
 *
 * @stable
 */
export interface OAuthRegistration {
  readonly clientId: string;
  /** Confidential clients only. */
  readonly clientSecret?: SecretValue;
  /** Set to `'dcr'` when the registration was produced by RFC 7591. */
  readonly registeredVia?: 'dcr' | 'manual';
  /** Human-readable name passed to the registration endpoint. */
  readonly clientName?: string;
}

/**
 * Result of the Dynamic Client Registration round-trip.
 *
 * @stable
 */
export interface DynamicClientRegistrationResult {
  readonly clientId: string;
  readonly clientSecret?: SecretValue;
  readonly clientIdIssuedAt?: number;
  readonly clientSecretExpiresAt?: number;
  readonly raw?: Readonly<Record<string, unknown>>;
}

/**
 * Live OAuth session. The `accessToken` is wrapped in {@link SecretValue}
 * even in memory so the standard leakage barriers apply if it ever
 * escapes into a log line.
 *
 * @stable
 */
export interface OAuthSession {
  readonly serverId: string;
  readonly accessToken: SecretValue;
  readonly refreshToken?: SecretValue;
  readonly idToken?: SecretValue;
  readonly tokenType: string;
  readonly scope?: string;
  readonly expiresAt?: number;
  readonly issuedAt: number;
}

/**
 * Audit-safe view of an OAuth session - never carries token material.
 * Used by `listOAuthSessions(...)` and the `/v1/health/secrets`
 * surface (Phase 14a).
 *
 * @stable
 */
export interface OAuthSessionMetadata {
  readonly serverId: string;
  readonly serverUrl: string;
  readonly clientId: string;
  readonly issuer?: string;
  readonly scope?: string;
  readonly expiresAt?: number;
  readonly lastRefreshedAt?: number;
  readonly registeredVia?: 'dcr' | 'manual';
  readonly hasAccessToken: boolean;
  readonly hasRefreshToken: boolean;
  readonly status: 'fresh' | 'expiring-soon' | 'expired' | 'unknown';
}

/**
 * Options accepted by `OAuthClient.authorizeCode(...)`.
 *
 * @stable
 */
export interface AuthorizeCodeOptions {
  readonly scope?: string;
  /**
   * Pre-existing redirect URI. When omitted the client will spin up a
   * localhost callback server on a random port in `49152-65535` and
   * use `http://127.0.0.1:<port>/callback`.
   */
  readonly redirectUri?: string;
  /**
   * Function to render the authorization URL to the user. Defaults to
   * `openInBrowser(url)` plus a console fallback. Consumers can plug
   * in their own UI.
   */
  readonly openAuthorizationUrl?: (url: string, signal?: AbortSignal) => Promise<void> | void;
  /**
   * Override the localhost port range. Inclusive on both ends.
   * Defaults to `[49152, 65535]`.
   */
  readonly portRange?: readonly [number, number];
  /** Maximum time spent waiting for the callback. Defaults to 5 min. */
  readonly callbackTimeoutMs?: number;
  /** Cancellation. Aborts the callback server, browser open, and exchange. */
  readonly signal?: AbortSignal;
}

/**
 * Options accepted by `OAuthClient.authorizeDevice(...)`.
 *
 * @stable
 */
export interface AuthorizeDeviceOptions {
  readonly scope?: string;
  /** Maximum time spent polling. Defaults to the server's `expires_in`. */
  readonly timeoutMs?: number;
  /**
   * Hook called once the device authorization response arrives. The
   * UI / CLI prints the user code + verification URL.
   */
  readonly onUserCode?: (info: DeviceUserCodeInfo) => void;
  /** Cancellation. */
  readonly signal?: AbortSignal;
}

/**
 * Information surfaced via {@link AuthorizeDeviceOptions.onUserCode}.
 *
 * @stable
 */
export interface DeviceUserCodeInfo {
  readonly userCode: string;
  readonly verificationUri: string;
  readonly verificationUriComplete?: string;
  readonly expiresAt: number;
  readonly intervalMs: number;
}

/**
 * Public surface of the {@link createOAuthClient} factory. Each method
 * accepts an `AbortSignal` so callers can cancel mid-flow.
 *
 * @stable
 */
export interface OAuthClient {
  readonly serverId: string;
  readonly serverUrl: string;
  /** Cached registration; the field reflects the latest known state. */
  readonly registration: OAuthRegistration | undefined;
  /** Cached metadata; the field reflects the latest known state. */
  readonly metadata: DiscoveredMetadata | undefined;

  /** Run discovery. Returns the cached value when available. */
  discover(opts?: { signal?: AbortSignal; force?: boolean }): Promise<DiscoveredMetadata>;
  /**
   * Run Dynamic Client Registration. The metadata's
   * `registration_endpoint` must be set; the call rejects with
   * `OAuthRegistrationUnsupportedError` otherwise.
   */
  registerClient(opts?: {
    clientName?: string;
    redirectUris?: ReadonlyArray<string>;
    scope?: string;
    signal?: AbortSignal;
  }): Promise<DynamicClientRegistrationResult>;

  /** Run the Authorization Code + PKCE flow. */
  authorizeCode(opts?: AuthorizeCodeOptions): Promise<OAuthSession>;
  /** Run the Device Authorization Grant. */
  authorizeDevice(opts?: AuthorizeDeviceOptions): Promise<OAuthSession>;

  /**
   * Refresh the access token. Reuses the in-flight refresh promise
   * when one is already running, so concurrent callers all observe
   * the same network round-trip.
   */
  refresh(opts?: { force?: boolean; signal?: AbortSignal }): Promise<OAuthSession>;
  /** Revoke the current session against the discovered revocation endpoint. */
  revoke(opts?: { reason?: string; signal?: AbortSignal }): Promise<void>;
  /** Audit-safe metadata view. Returns `null` when no session is stored. */
  status(): Promise<OAuthSessionMetadata | null>;
}

/**
 * Strategy hook contract for per-provider quirks (e.g. Slack
 * `client_secret` rotation, Linear refresh-token rotation per use).
 *
 * @stable
 */
export interface OAuthStrategy {
  /** Match against `serverUrl` or `serverId`. */
  readonly id: string;
  /** Optional regex applied to `serverUrl`. */
  readonly matchUrl?: RegExp;
  /** Optional regex applied to `serverId`. */
  readonly matchId?: RegExp;
  /**
   * Called after a successful token rotation (refresh + DCR). Lets
   * the strategy update the persisted registration / token refs.
   */
  readonly onTokenRotation?: (event: TokenRotationEvent) => void | Promise<void>;
  /** Called when a refresh fails. */
  readonly onRefreshFailure?: (event: RefreshFailureEvent) => void | Promise<void>;
}

/**
 * Snapshot passed to {@link OAuthStrategy.onTokenRotation}.
 *
 * @stable
 */
export interface TokenRotationEvent {
  readonly serverId: string;
  readonly serverUrl: string;
  readonly previousScope?: string;
  readonly nextScope?: string;
  readonly issuedAt: number;
}

/**
 * Snapshot passed to {@link OAuthStrategy.onRefreshFailure}.
 *
 * @stable
 */
export interface RefreshFailureEvent {
  readonly serverId: string;
  readonly serverUrl: string;
  readonly reason: string;
  readonly hint?: string;
  readonly attemptedAt: number;
}
