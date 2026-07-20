/**
 * Outbound OAuth subsystem of `@graphorin/security`. Implements the
 * OAuth 2.1 surface required by the MCP authorization spec
 * (Authorization Code + PKCE-S256 with RFC 7636, Refresh Token
 * grant + RFC 6749 § 6 rotation, Device Authorization Grant per
 * RFC 8628, Dynamic Client Registration per RFC 7591, server +
 * resource metadata discovery per RFC 8414 + RFC 9728, and the
 * RFC 7009 token-revocation endpoint).
 *
 * @packageDocumentation
 */

export {
  _getOAuthAuditListenerCountForTesting,
  _resetOAuthAuditListenersForTesting,
  emitOAuthAudit,
  type OAuthAuditAction,
  type OAuthAuditActor,
  type OAuthAuditDecision,
  type OAuthAuditEvent,
  type OAuthAuditListener,
  onOAuthAudit,
} from './audit-emitter.js';
export {
  type AuthorizationCodeFlowArgs,
  buildOAuthSession,
  runAuthorizationCodeFlow,
} from './authorize-code-flow.js';
export {
  _setDeviceAuthFetcherForTesting,
  type DeviceAuthFetcher,
  type DeviceAuthorizationFlowArgs,
  type DeviceAuthorizationResponse,
  runDeviceAuthorizationFlow,
} from './authorize-device-flow.js';
export {
  _setBrowserOpenerForTesting,
  type BrowserOpener,
  openInBrowser,
} from './browser.js';
export {
  type CallbackParams,
  type LocalCallbackServer,
  type LocalCallbackServerOptions,
  startLocalCallbackServer,
} from './callback-server.js';
export { createOAuthClient } from './client.js';
export {
  _setDiscoveryFetcherForTesting,
  type DiscoveryFetcher,
  discoverMetadata,
  fetchAuthorizationServerMetadata,
  tryProtectedResourceMetadata,
} from './discovery.js';
export {
  _setDcrFetcherForTesting,
  type DcrFetcher,
  type RegisterDynamicClientOptions,
  registerDynamicClient,
} from './dynamic-client-registration.js';
export {
  GraphorinOAuthError,
  OAuthAuthorizationError,
  OAuthCallbackError,
  OAuthCallbackPortError,
  OAuthDiscoveryError,
  OAuthFlowAbortedError,
  OAuthPeerDependencyMissingError,
  OAuthRefreshError,
  OAuthRegistrationError,
  OAuthRegistrationUnsupportedError,
  OAuthRevokedError,
  readOAuthErrorFields,
} from './errors.js';
export {
  _resetOAuthLifecycleListenersForTesting,
  emitOAuthLifecycle,
  type OAuthLifecycleEvent,
  type OAuthLifecycleEventName,
  type OAuthLifecycleListener,
  onOAuthLifecycle,
} from './events.js';
export { createInMemoryOAuthServerStore } from './in-memory-store.js';
export {
  getOAuthStatus,
  type LoginInteractiveOptions,
  type LoginInteractiveResult,
  listOAuthSessions,
  loginInteractive,
  type OAuthStatusSnapshot,
  refreshOAuthSession,
  revokeOAuthSession,
} from './library.js';
export {
  base64Url,
  computePkceChallenge,
  generatePkceVerifier,
  generateState,
} from './pkce.js';
export {
  _getInflightRefreshKeysForTesting,
  _resetInflightRefreshForTesting,
  _setRevocationFetcherForTesting,
  type RefreshAccessTokenArgs,
  type RevocationFetcher,
  type RevokeOAuthTokenArgs,
  refreshAccessToken,
  revokeOAuthToken,
} from './refresh.js';
export {
  _resetOAuthStrategiesForTesting,
  findOAuthStrategies,
  listOAuthStrategies,
  registerOAuthStrategy,
} from './strategies.js';
export {
  _setTokenEndpointFetcherForTesting,
  encodeBasicAuth,
  postToTokenEndpoint,
  type TokenEndpointBody,
  type TokenEndpointFetcher,
  type TokenEndpointResponse,
} from './token-endpoint.js';
export type {
  AuthorizeCodeOptions,
  AuthorizeDeviceOptions,
  CreateOAuthClientOptions,
  DeviceUserCodeInfo,
  DiscoveredMetadata,
  DynamicClientRegistrationResult,
  OAuthClient,
  OAuthRegistration,
  OAuthServerMetadata,
  OAuthSession,
  OAuthSessionMetadata,
  OAuthStrategy,
  ProtectedResourceMetadata,
  RefreshFailureEvent,
  TokenRotationEvent,
} from './types.js';
