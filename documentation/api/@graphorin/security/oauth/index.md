[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / oauth

# oauth

Outbound OAuth subsystem of `@graphorin/security`. Implements the
OAuth 2.1 surface required by the MCP authorization spec
(Authorization Code + PKCE-S256 with RFC 7636, Refresh Token
grant + RFC 6749 § 6 rotation, Device Authorization Grant per
RFC 8628, Dynamic Client Registration per RFC 7591, server +
resource metadata discovery per RFC 8414 + RFC 9728, and the
RFC 7009 token-revocation endpoint).

## References

### \_getInflightRefreshKeysForTesting

Re-exports [_getInflightRefreshKeysForTesting](/api/@graphorin/security/functions/getInflightRefreshKeysForTesting.md)

***

### \_getOAuthAuditListenerCountForTesting

Re-exports [_getOAuthAuditListenerCountForTesting](/api/@graphorin/security/functions/getOAuthAuditListenerCountForTesting.md)

***

### \_resetInflightRefreshForTesting

Re-exports [_resetInflightRefreshForTesting](/api/@graphorin/security/functions/resetInflightRefreshForTesting.md)

***

### \_resetOAuthAuditListenersForTesting

Re-exports [_resetOAuthAuditListenersForTesting](/api/@graphorin/security/functions/resetOAuthAuditListenersForTesting.md)

***

### \_resetOAuthLifecycleListenersForTesting

Re-exports [_resetOAuthLifecycleListenersForTesting](/api/@graphorin/security/functions/resetOAuthLifecycleListenersForTesting.md)

***

### \_resetOAuthStrategiesForTesting

Re-exports [_resetOAuthStrategiesForTesting](/api/@graphorin/security/functions/resetOAuthStrategiesForTesting.md)

***

### \_setBrowserOpenerForTesting

Re-exports [_setBrowserOpenerForTesting](/api/@graphorin/security/functions/setBrowserOpenerForTesting.md)

***

### \_setDcrFetcherForTesting

Re-exports [_setDcrFetcherForTesting](/api/@graphorin/security/functions/setDcrFetcherForTesting.md)

***

### \_setDeviceAuthFetcherForTesting

Re-exports [_setDeviceAuthFetcherForTesting](/api/@graphorin/security/functions/setDeviceAuthFetcherForTesting.md)

***

### \_setDiscoveryFetcherForTesting

Re-exports [_setDiscoveryFetcherForTesting](/api/@graphorin/security/functions/setDiscoveryFetcherForTesting.md)

***

### \_setRevocationFetcherForTesting

Re-exports [_setRevocationFetcherForTesting](/api/@graphorin/security/functions/setRevocationFetcherForTesting.md)

***

### \_setTokenEndpointFetcherForTesting

Re-exports [_setTokenEndpointFetcherForTesting](/api/@graphorin/security/functions/setTokenEndpointFetcherForTesting.md)

***

### AuthorizationCodeFlowArgs

Re-exports [AuthorizationCodeFlowArgs](/api/@graphorin/security/interfaces/AuthorizationCodeFlowArgs.md)

***

### AuthorizeCodeOptions

Re-exports [AuthorizeCodeOptions](/api/@graphorin/security/interfaces/AuthorizeCodeOptions.md)

***

### AuthorizeDeviceOptions

Re-exports [AuthorizeDeviceOptions](/api/@graphorin/security/interfaces/AuthorizeDeviceOptions.md)

***

### base64Url

Re-exports [base64Url](/api/@graphorin/security/functions/base64Url.md)

***

### BrowserOpener

Re-exports [BrowserOpener](/api/@graphorin/security/type-aliases/BrowserOpener.md)

***

### buildOAuthSession

Re-exports [buildOAuthSession](/api/@graphorin/security/functions/buildOAuthSession.md)

***

### CallbackParams

Re-exports [CallbackParams](/api/@graphorin/security/interfaces/CallbackParams.md)

***

### computePkceChallenge

Re-exports [computePkceChallenge](/api/@graphorin/security/functions/computePkceChallenge.md)

***

### createInMemoryOAuthServerStore

Re-exports [createInMemoryOAuthServerStore](/api/@graphorin/security/functions/createInMemoryOAuthServerStore.md)

***

### createOAuthClient

Re-exports [createOAuthClient](/api/@graphorin/security/functions/createOAuthClient.md)

***

### CreateOAuthClientOptions

Re-exports [CreateOAuthClientOptions](/api/@graphorin/security/interfaces/CreateOAuthClientOptions.md)

***

### DcrFetcher

Re-exports [DcrFetcher](/api/@graphorin/security/type-aliases/DcrFetcher.md)

***

### DeviceAuthFetcher

Re-exports [DeviceAuthFetcher](/api/@graphorin/security/type-aliases/DeviceAuthFetcher.md)

***

### DeviceAuthorizationFlowArgs

Re-exports [DeviceAuthorizationFlowArgs](/api/@graphorin/security/interfaces/DeviceAuthorizationFlowArgs.md)

***

### DeviceAuthorizationResponse

Re-exports [DeviceAuthorizationResponse](/api/@graphorin/security/interfaces/DeviceAuthorizationResponse.md)

***

### DeviceUserCodeInfo

Re-exports [DeviceUserCodeInfo](/api/@graphorin/security/interfaces/DeviceUserCodeInfo.md)

***

### DiscoveredMetadata

Re-exports [DiscoveredMetadata](/api/@graphorin/security/interfaces/DiscoveredMetadata.md)

***

### discoverMetadata

Re-exports [discoverMetadata](/api/@graphorin/security/functions/discoverMetadata.md)

***

### DiscoveryFetcher

Re-exports [DiscoveryFetcher](/api/@graphorin/security/type-aliases/DiscoveryFetcher.md)

***

### DynamicClientRegistrationResult

Re-exports [DynamicClientRegistrationResult](/api/@graphorin/security/interfaces/DynamicClientRegistrationResult.md)

***

### emitOAuthAudit

Re-exports [emitOAuthAudit](/api/@graphorin/security/functions/emitOAuthAudit.md)

***

### emitOAuthLifecycle

Re-exports [emitOAuthLifecycle](/api/@graphorin/security/functions/emitOAuthLifecycle.md)

***

### encodeBasicAuth

Re-exports [encodeBasicAuth](/api/@graphorin/security/functions/encodeBasicAuth.md)

***

### fetchAuthorizationServerMetadata

Re-exports [fetchAuthorizationServerMetadata](/api/@graphorin/security/functions/fetchAuthorizationServerMetadata.md)

***

### findOAuthStrategies

Re-exports [findOAuthStrategies](/api/@graphorin/security/functions/findOAuthStrategies.md)

***

### generatePkceVerifier

Re-exports [generatePkceVerifier](/api/@graphorin/security/functions/generatePkceVerifier.md)

***

### generateState

Re-exports [generateState](/api/@graphorin/security/functions/generateState.md)

***

### getOAuthStatus

Re-exports [getOAuthStatus](/api/@graphorin/security/functions/getOAuthStatus.md)

***

### GraphorinOAuthError

Re-exports [GraphorinOAuthError](/api/@graphorin/security/classes/GraphorinOAuthError.md)

***

### listOAuthSessions

Re-exports [listOAuthSessions](/api/@graphorin/security/functions/listOAuthSessions.md)

***

### listOAuthStrategies

Re-exports [listOAuthStrategies](/api/@graphorin/security/functions/listOAuthStrategies.md)

***

### LocalCallbackServer

Re-exports [LocalCallbackServer](/api/@graphorin/security/interfaces/LocalCallbackServer.md)

***

### LocalCallbackServerOptions

Re-exports [LocalCallbackServerOptions](/api/@graphorin/security/interfaces/LocalCallbackServerOptions.md)

***

### loginInteractive

Re-exports [loginInteractive](/api/@graphorin/security/functions/loginInteractive.md)

***

### LoginInteractiveOptions

Re-exports [LoginInteractiveOptions](/api/@graphorin/security/interfaces/LoginInteractiveOptions.md)

***

### LoginInteractiveResult

Re-exports [LoginInteractiveResult](/api/@graphorin/security/interfaces/LoginInteractiveResult.md)

***

### OAuthAuditAction

Re-exports [OAuthAuditAction](/api/@graphorin/security/type-aliases/OAuthAuditAction.md)

***

### OAuthAuditActor

Re-exports [OAuthAuditActor](/api/@graphorin/security/interfaces/OAuthAuditActor.md)

***

### OAuthAuditDecision

Re-exports [OAuthAuditDecision](/api/@graphorin/security/type-aliases/OAuthAuditDecision.md)

***

### OAuthAuditEvent

Re-exports [OAuthAuditEvent](/api/@graphorin/security/interfaces/OAuthAuditEvent.md)

***

### OAuthAuthorizationError

Re-exports [OAuthAuthorizationError](/api/@graphorin/security/classes/OAuthAuthorizationError.md)

***

### OAuthCallbackError

Re-exports [OAuthCallbackError](/api/@graphorin/security/classes/OAuthCallbackError.md)

***

### OAuthCallbackPortError

Re-exports [OAuthCallbackPortError](/api/@graphorin/security/classes/OAuthCallbackPortError.md)

***

### OAuthClient

Re-exports [OAuthClient](/api/@graphorin/security/interfaces/OAuthClient.md)

***

### OAuthDiscoveryError

Re-exports [OAuthDiscoveryError](/api/@graphorin/security/classes/OAuthDiscoveryError.md)

***

### OAuthFlowAbortedError

Re-exports [OAuthFlowAbortedError](/api/@graphorin/security/classes/OAuthFlowAbortedError.md)

***

### OAuthLifecycleEvent

Re-exports [OAuthLifecycleEvent](/api/@graphorin/security/interfaces/OAuthLifecycleEvent.md)

***

### OAuthLifecycleEventName

Re-exports [OAuthLifecycleEventName](/api/@graphorin/security/type-aliases/OAuthLifecycleEventName.md)

***

### OAuthPeerDependencyMissingError

Re-exports [OAuthPeerDependencyMissingError](/api/@graphorin/security/classes/OAuthPeerDependencyMissingError.md)

***

### OAuthRefreshError

Re-exports [OAuthRefreshError](/api/@graphorin/security/classes/OAuthRefreshError.md)

***

### OAuthRegistration

Re-exports [OAuthRegistration](/api/@graphorin/security/interfaces/OAuthRegistration.md)

***

### OAuthRegistrationUnsupportedError

Re-exports [OAuthRegistrationUnsupportedError](/api/@graphorin/security/classes/OAuthRegistrationUnsupportedError.md)

***

### OAuthRevokedError

Re-exports [OAuthRevokedError](/api/@graphorin/security/classes/OAuthRevokedError.md)

***

### OAuthServerMetadata

Re-exports [OAuthServerMetadata](/api/@graphorin/security/interfaces/OAuthServerMetadata.md)

***

### OAuthSession

Re-exports [OAuthSession](/api/@graphorin/security/interfaces/OAuthSession.md)

***

### OAuthSessionMetadata

Re-exports [OAuthSessionMetadata](/api/@graphorin/security/interfaces/OAuthSessionMetadata.md)

***

### OAuthStatusSnapshot

Re-exports [OAuthStatusSnapshot](/api/@graphorin/security/interfaces/OAuthStatusSnapshot.md)

***

### OAuthStrategy

Re-exports [OAuthStrategy](/api/@graphorin/security/interfaces/OAuthStrategy.md)

***

### onOAuthAudit

Re-exports [onOAuthAudit](/api/@graphorin/security/functions/onOAuthAudit.md)

***

### onOAuthLifecycle

Re-exports [onOAuthLifecycle](/api/@graphorin/security/functions/onOAuthLifecycle.md)

***

### openInBrowser

Re-exports [openInBrowser](/api/@graphorin/security/functions/openInBrowser.md)

***

### postToTokenEndpoint

Re-exports [postToTokenEndpoint](/api/@graphorin/security/functions/postToTokenEndpoint.md)

***

### ProtectedResourceMetadata

Re-exports [ProtectedResourceMetadata](/api/@graphorin/security/interfaces/ProtectedResourceMetadata.md)

***

### refreshAccessToken

Re-exports [refreshAccessToken](/api/@graphorin/security/functions/refreshAccessToken.md)

***

### RefreshAccessTokenArgs

Re-exports [RefreshAccessTokenArgs](/api/@graphorin/security/interfaces/RefreshAccessTokenArgs.md)

***

### RefreshFailureEvent

Re-exports [RefreshFailureEvent](/api/@graphorin/security/interfaces/RefreshFailureEvent.md)

***

### refreshOAuthSession

Re-exports [refreshOAuthSession](/api/@graphorin/security/functions/refreshOAuthSession.md)

***

### registerDynamicClient

Re-exports [registerDynamicClient](/api/@graphorin/security/functions/registerDynamicClient.md)

***

### RegisterDynamicClientOptions

Re-exports [RegisterDynamicClientOptions](/api/@graphorin/security/interfaces/RegisterDynamicClientOptions.md)

***

### registerOAuthStrategy

Re-exports [registerOAuthStrategy](/api/@graphorin/security/functions/registerOAuthStrategy.md)

***

### RevocationFetcher

Re-exports [RevocationFetcher](/api/@graphorin/security/type-aliases/RevocationFetcher.md)

***

### revokeOAuthSession

Re-exports [revokeOAuthSession](/api/@graphorin/security/functions/revokeOAuthSession.md)

***

### revokeOAuthToken

Re-exports [revokeOAuthToken](/api/@graphorin/security/functions/revokeOAuthToken.md)

***

### RevokeOAuthTokenArgs

Re-exports [RevokeOAuthTokenArgs](/api/@graphorin/security/interfaces/RevokeOAuthTokenArgs.md)

***

### runAuthorizationCodeFlow

Re-exports [runAuthorizationCodeFlow](/api/@graphorin/security/functions/runAuthorizationCodeFlow.md)

***

### runDeviceAuthorizationFlow

Re-exports [runDeviceAuthorizationFlow](/api/@graphorin/security/functions/runDeviceAuthorizationFlow.md)

***

### startLocalCallbackServer

Re-exports [startLocalCallbackServer](/api/@graphorin/security/functions/startLocalCallbackServer.md)

***

### TokenEndpointBody

Re-exports [TokenEndpointBody](/api/@graphorin/security/interfaces/TokenEndpointBody.md)

***

### TokenEndpointFetcher

Re-exports [TokenEndpointFetcher](/api/@graphorin/security/type-aliases/TokenEndpointFetcher.md)

***

### TokenEndpointResponse

Re-exports [TokenEndpointResponse](/api/@graphorin/security/interfaces/TokenEndpointResponse.md)

***

### TokenRotationEvent

Re-exports [TokenRotationEvent](/api/@graphorin/security/interfaces/TokenRotationEvent.md)

***

### tryProtectedResourceMetadata

Re-exports [tryProtectedResourceMetadata](/api/@graphorin/security/functions/tryProtectedResourceMetadata.md)
