[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / auth

# auth

Server token-auth surface for `@graphorin/security`. Combines the
token format primitives, the scope grammar, the verify pipeline,
and the token CRUD library functions used by `@graphorin/server`
and the CLI.

## References

### \_getAuthAuditListenerCountForTesting

Re-exports [_getAuthAuditListenerCountForTesting](/api/@graphorin/security/functions/getAuthAuditListenerCountForTesting.md)

***

### \_resetAuthAuditListenersForTesting

Re-exports [_resetAuthAuditListenersForTesting](/api/@graphorin/security/functions/resetAuthAuditListenersForTesting.md)

***

### AuthAuditAction

Re-exports [AuthAuditAction](/api/@graphorin/security/type-aliases/AuthAuditAction.md)

***

### AuthAuditActor

Re-exports [AuthAuditActor](/api/@graphorin/security/interfaces/AuthAuditActor.md)

***

### AuthAuditDecision

Re-exports [AuthAuditDecision](/api/@graphorin/security/type-aliases/AuthAuditDecision.md)

***

### AuthAuditEvent

Re-exports [AuthAuditEvent](/api/@graphorin/security/interfaces/AuthAuditEvent.md)

***

### AuthAuditListener

Re-exports [AuthAuditListener](/api/@graphorin/security/type-aliases/AuthAuditListener.md)

***

### authorize

Re-exports [authorize](/api/@graphorin/security/functions/authorize.md)

***

### crc32

Re-exports [crc32](/api/@graphorin/security/functions/crc32.md)

***

### CreatedToken

Re-exports [CreatedToken](/api/@graphorin/security/interfaces/CreatedToken.md)

***

### createToken

Re-exports [createToken](/api/@graphorin/security/functions/createToken.md)

***

### CreateTokenOptions

Re-exports [CreateTokenOptions](/api/@graphorin/security/interfaces/CreateTokenOptions.md)

***

### DEFAULT\_TOKEN\_PREFIX

Re-exports [DEFAULT_TOKEN_PREFIX](/api/@graphorin/security/variables/DEFAULT_TOKEN_PREFIX.md)

***

### emitAuthAudit

Re-exports [emitAuthAudit](/api/@graphorin/security/functions/emitAuthAudit.md)

***

### encodeBase62Bytes

Re-exports [encodeBase62Bytes](/api/@graphorin/security/functions/encodeBase62Bytes.md)

***

### encodeBase62Integer

Re-exports [encodeBase62Integer](/api/@graphorin/security/functions/encodeBase62Integer.md)

***

### generatePepper

Re-exports [generatePepper](/api/@graphorin/security/functions/generatePepper.md)

***

### generateRawToken

Re-exports [generateRawToken](/api/@graphorin/security/functions/generateRawToken.md)

***

### GenerateRawTokenOptions

Re-exports [GenerateRawTokenOptions](/api/@graphorin/security/interfaces/GenerateRawTokenOptions.md)

***

### listTokens

Re-exports [listTokens](/api/@graphorin/security/functions/listTokens.md)

***

### onAuthAudit

Re-exports [onAuthAudit](/api/@graphorin/security/functions/onAuthAudit.md)

***

### ParsedScope

Re-exports [ParsedScope](/api/@graphorin/security/type-aliases/ParsedScope.md)

***

### ParsedToken

Re-exports [ParsedToken](/api/@graphorin/security/type-aliases/ParsedToken.md)

***

### parseScope

Re-exports [parseScope](/api/@graphorin/security/functions/parseScope.md)

***

### parseToken

Re-exports [parseToken](/api/@graphorin/security/functions/parseToken.md)

***

### ParseTokenOptions

Re-exports [ParseTokenOptions](/api/@graphorin/security/interfaces/ParseTokenOptions.md)

***

### rekeyTokens

Re-exports [rekeyTokens](/api/@graphorin/security/functions/rekeyTokens.md)

***

### revokeToken

Re-exports [revokeToken](/api/@graphorin/security/functions/revokeToken.md)

***

### rotateToken

Re-exports [rotateToken](/api/@graphorin/security/functions/rotateToken.md)

***

### SCOPE\_CATALOGUE

Re-exports [SCOPE_CATALOGUE](/api/@graphorin/security/variables/SCOPE_CATALOGUE.md)

***

### scopeMatches

Re-exports [scopeMatches](/api/@graphorin/security/functions/scopeMatches.md)

***

### ScopeParseError

Re-exports [ScopeParseError](/api/@graphorin/security/classes/ScopeParseError.md)

***

### scopeSetMatches

Re-exports [scopeSetMatches](/api/@graphorin/security/functions/scopeSetMatches.md)

***

### TOKEN\_CHECKSUM\_LENGTH

Re-exports [TOKEN_CHECKSUM_LENGTH](/api/@graphorin/security/variables/TOKEN_CHECKSUM_LENGTH.md)

***

### TOKEN\_ENTROPY\_BYTES

Re-exports [TOKEN_ENTROPY_BYTES](/api/@graphorin/security/variables/TOKEN_ENTROPY_BYTES.md)

***

### TOKEN\_ENTROPY\_LENGTH

Re-exports [TOKEN_ENTROPY_LENGTH](/api/@graphorin/security/variables/TOKEN_ENTROPY_LENGTH.md)

***

### TOKEN\_ENVIRONMENTS

Re-exports [TOKEN_ENVIRONMENTS](/api/@graphorin/security/variables/TOKEN_ENVIRONMENTS.md)

***

### TOKEN\_VERSION

Re-exports [TOKEN_VERSION](/api/@graphorin/security/variables/TOKEN_VERSION.md)

***

### TokenEnvironment

Re-exports [TokenEnvironment](/api/@graphorin/security/type-aliases/TokenEnvironment.md)

***

### TokenFormatError

Re-exports [TokenFormatError](/api/@graphorin/security/classes/TokenFormatError.md)

***

### TokenFormatErrorKind

Re-exports [TokenFormatErrorKind](/api/@graphorin/security/type-aliases/TokenFormatErrorKind.md)

***

### TokenLockedOutError

Re-exports [TokenLockedOutError](/api/@graphorin/security/classes/TokenLockedOutError.md)

***

### TokenMetadata

Re-exports [TokenMetadata](/api/@graphorin/security/interfaces/TokenMetadata.md)

***

### TokenVerifier

Re-exports [TokenVerifier](/api/@graphorin/security/classes/TokenVerifier.md)

***

### TokenVerifierStatus

Re-exports [TokenVerifierStatus](/api/@graphorin/security/interfaces/TokenVerifierStatus.md)

***

### TokenVerifyOverloadError

Re-exports [TokenVerifyOverloadError](/api/@graphorin/security/classes/TokenVerifyOverloadError.md)

***

### tryParseScope

Re-exports [tryParseScope](/api/@graphorin/security/functions/tryParseScope.md)

***

### validateScopeSet

Re-exports [validateScopeSet](/api/@graphorin/security/functions/validateScopeSet.md)

***

### VerifiedToken

Re-exports [VerifiedToken](/api/@graphorin/security/interfaces/VerifiedToken.md)

***

### VerifierOptions

Re-exports [VerifierOptions](/api/@graphorin/security/interfaces/VerifierOptions.md)

***

### VerifyContext

Re-exports [VerifyContext](/api/@graphorin/security/interfaces/VerifyContext.md)

***

### VerifyFailureReason

Re-exports [VerifyFailureReason](/api/@graphorin/security/type-aliases/VerifyFailureReason.md)

***

### verifyOffline

Re-exports [verifyOffline](/api/@graphorin/security/functions/verifyOffline.md)

***

### VerifyResult

Re-exports [VerifyResult](/api/@graphorin/security/type-aliases/VerifyResult.md)

***

### verifyToken

Re-exports [verifyToken](/api/@graphorin/security/functions/verifyToken.md)

***

### WeakPepperError

Re-exports [WeakPepperError](/api/@graphorin/security/classes/WeakPepperError.md)
