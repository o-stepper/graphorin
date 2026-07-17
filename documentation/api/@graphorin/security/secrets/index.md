[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / secrets

# secrets

Secrets foundations for `@graphorin/security`. Exposes the
runtime-safe `SecretValue` wrapper, the strict `SecretRef` URI
parser, the pluggable resolver registry, four built-in
`SecretsStore` implementations, the per-tool ACL primitives, and the
`createSecretsStore({ kind: 'auto' })` factory with downgrade audit.

## References

### \_getSecretsAuditListenerCountForTesting

Re-exports [_getSecretsAuditListenerCountForTesting](/api/@graphorin/security/functions/getSecretsAuditListenerCountForTesting.md)

***

### \_resetFileResolverWarningsForTesting

Re-exports [_resetFileResolverWarningsForTesting](/api/@graphorin/security/functions/resetFileResolverWarningsForTesting.md)

***

### \_resetLiteralResolverForTesting

Re-exports [_resetLiteralResolverForTesting](/api/@graphorin/security/functions/resetLiteralResolverForTesting.md)

***

### \_resetResolversForTesting

Re-exports [_resetResolversForTesting](/api/@graphorin/security/functions/resetResolversForTesting.md)

***

### \_resetSecretsAuditListenersForTesting

Re-exports [_resetSecretsAuditListenersForTesting](/api/@graphorin/security/functions/resetSecretsAuditListenersForTesting.md)

***

### \_resetSecretsFactoryForTesting

Re-exports [_resetSecretsFactoryForTesting](/api/@graphorin/security/functions/resetSecretsFactoryForTesting.md)

***

### \_resetSecretValueAuditListenersForTesting

Re-exports [_resetSecretValueAuditListenersForTesting](/api/@graphorin/security/functions/resetSecretValueAuditListenersForTesting.md)

***

### \_resetWithSecretListenersForTesting

Re-exports [_resetWithSecretListenersForTesting](/api/@graphorin/security/functions/resetWithSecretListenersForTesting.md)

***

### \_setArgon2idForTesting

Re-exports [_setArgon2idForTesting](/api/@graphorin/security/functions/setArgon2idForTesting.md)

***

### \_setKeyringEntryCtorForTesting

Re-exports [_setKeyringEntryCtorForTesting](/api/@graphorin/security/functions/setKeyringEntryCtorForTesting.md)

***

### areBuiltinsInstalled

Re-exports [areBuiltinsInstalled](/api/@graphorin/security/functions/areBuiltinsInstalled.md)

***

### assertNotNakedString

Re-exports [assertNotNakedString](/api/@graphorin/security/functions/assertNotNakedString.md)

***

### AUTHORITY\_OPTIONAL\_SCHEMES

Re-exports [AUTHORITY_OPTIONAL_SCHEMES](/api/@graphorin/security/variables/AUTHORITY_OPTIONAL_SCHEMES.md)

***

### BUILTIN\_SCHEMES

Re-exports [BUILTIN_SCHEMES](/api/@graphorin/security/variables/BUILTIN_SCHEMES.md)

***

### composeChain

Re-exports [composeChain](/api/@graphorin/security/functions/composeChain.md)

***

### computeEffectiveAllowlist

Re-exports [computeEffectiveAllowlist](/api/@graphorin/security/functions/computeEffectiveAllowlist.md)

***

### createSecretsStore

Re-exports [createSecretsStore](/api/@graphorin/security/functions/createSecretsStore.md)

***

### CreateSecretsStoreOptions

Re-exports [CreateSecretsStoreOptions](/api/@graphorin/security/interfaces/CreateSecretsStoreOptions.md)

***

### decryptBundle

Re-exports [decryptBundle](/api/@graphorin/security/functions/decryptBundle.md)

***

### deriveAesKey

Re-exports [deriveAesKey](/api/@graphorin/security/functions/deriveAesKey.md)

***

### describeParseErrorKind

Re-exports [describeParseErrorKind](/api/@graphorin/security/functions/describeParseErrorKind.md)

***

### detectHeadless

Re-exports [detectHeadless](/api/@graphorin/security/functions/detectHeadless.md)

***

### emitSecretsAudit

Re-exports [emitSecretsAudit](/api/@graphorin/security/functions/emitSecretsAudit.md)

***

### ENCRYPTED\_FILE\_MAGIC

Re-exports [ENCRYPTED_FILE_MAGIC](/api/@graphorin/security/variables/ENCRYPTED_FILE_MAGIC.md)

***

### encryptedFileResolver

Re-exports [encryptedFileResolver](/api/@graphorin/security/variables/encryptedFileResolver.md)

***

### EncryptedFileSecretsStore

Re-exports [EncryptedFileSecretsStore](/api/@graphorin/security/classes/EncryptedFileSecretsStore.md)

***

### EncryptedFileSecretsStoreOptions

Re-exports [EncryptedFileSecretsStoreOptions](/api/@graphorin/security/interfaces/EncryptedFileSecretsStoreOptions.md)

***

### enforceSecretAcl

Re-exports [enforceSecretAcl](/api/@graphorin/security/functions/enforceSecretAcl.md)

***

### envResolver

Re-exports [envResolver](/api/@graphorin/security/variables/envResolver.md)

***

### EnvSecretsStore

Re-exports [EnvSecretsStore](/api/@graphorin/security/classes/EnvSecretsStore.md)

***

### EnvSecretsStoreOptions

Re-exports [EnvSecretsStoreOptions](/api/@graphorin/security/interfaces/EnvSecretsStoreOptions.md)

***

### fileResolver

Re-exports [fileResolver](/api/@graphorin/security/variables/fileResolver.md)

***

### getActiveSecretsStore

Re-exports [getActiveSecretsStore](/api/@graphorin/security/functions/getActiveSecretsStore.md)

***

### getActiveToolSecretsContext

Re-exports [getActiveToolSecretsContext](/api/@graphorin/security/functions/getActiveToolSecretsContext.md)

***

### getQueryParam

Re-exports [getQueryParam](/api/@graphorin/security/functions/getQueryParam.md)

***

### getQueryParamAll

Re-exports [getQueryParamAll](/api/@graphorin/security/functions/getQueryParamAll.md)

***

### getQueryParamRequired

Re-exports [getQueryParamRequired](/api/@graphorin/security/functions/getQueryParamRequired.md)

***

### getResolver

Re-exports [getResolver](/api/@graphorin/security/functions/getResolver.md)

***

### getSecretsStoreStatus

Re-exports [getSecretsStoreStatus](/api/@graphorin/security/functions/getSecretsStoreStatus.md)

***

### GraphorinSecretsError

Re-exports [GraphorinSecretsError](/api/@graphorin/security/classes/GraphorinSecretsError.md)

***

### installBuiltinResolvers

Re-exports [installBuiltinResolvers](/api/@graphorin/security/functions/installBuiltinResolvers.md)

***

### isLiteralAllowed

Re-exports [isLiteralAllowed](/api/@graphorin/security/functions/isLiteralAllowed.md)

***

### KEYRING\_DEFAULT\_SERVICE

Re-exports [KEYRING_DEFAULT_SERVICE](/api/@graphorin/security/variables/KEYRING_DEFAULT_SERVICE.md)

***

### keyringResolver

Re-exports [keyringResolver](/api/@graphorin/security/variables/keyringResolver.md)

***

### KeyringSecretsStore

Re-exports [KeyringSecretsStore](/api/@graphorin/security/classes/KeyringSecretsStore.md)

***

### KeyringSecretsStoreOptions

Re-exports [KeyringSecretsStoreOptions](/api/@graphorin/security/interfaces/KeyringSecretsStoreOptions.md)

***

### listResolverSchemes

Re-exports [listResolverSchemes](/api/@graphorin/security/functions/listResolverSchemes.md)

***

### literalResolver

Re-exports [literalResolver](/api/@graphorin/security/variables/literalResolver.md)

***

### LiteralSecretsForbiddenError

Re-exports [LiteralSecretsForbiddenError](/api/@graphorin/security/classes/LiteralSecretsForbiddenError.md)

***

### MemorySecretsStore

Re-exports [MemorySecretsStore](/api/@graphorin/security/classes/MemorySecretsStore.md)

***

### MemoryStoreInProductionError

Re-exports [MemoryStoreInProductionError](/api/@graphorin/security/classes/MemoryStoreInProductionError.md)

***

### MissingPeerDependencyError

Re-exports [MissingPeerDependencyError](/api/@graphorin/security/classes/MissingPeerDependencyError.md)

***

### onSecretsAudit

Re-exports [onSecretsAudit](/api/@graphorin/security/functions/onSecretsAudit.md)

***

### onSecretValueAudit

Re-exports [onSecretValueAudit](/api/@graphorin/security/functions/onSecretValueAudit.md)

***

### onWithSecretAudit

Re-exports [onWithSecretAudit](/api/@graphorin/security/functions/onWithSecretAudit.md)

***

### OPAQUE\_ONLY\_SCHEMES

Re-exports [OPAQUE_ONLY_SCHEMES](/api/@graphorin/security/variables/OPAQUE_ONLY_SCHEMES.md)

***

### parseAuthority

Re-exports [parseAuthority](/api/@graphorin/security/functions/parseAuthority.md)

***

### ParsedSecretRef

Re-exports [ParsedSecretRef](/api/@graphorin/security/interfaces/ParsedSecretRef.md)

***

### parseOrAssert

Re-exports [parseOrAssert](/api/@graphorin/security/functions/parseOrAssert.md)

***

### parseSecretRef

Re-exports [parseSecretRef](/api/@graphorin/security/functions/parseSecretRef.md)

***

### parseSecretsSourceEnv

Re-exports [parseSecretsSourceEnv](/api/@graphorin/security/functions/parseSecretsSourceEnv.md)

***

### refResolver

Re-exports [refResolver](/api/@graphorin/security/variables/refResolver.md)

***

### RefStoreLookup

Re-exports [RefStoreLookup](/api/@graphorin/security/type-aliases/RefStoreLookup.md)

***

### registerResolver

Re-exports [registerResolver](/api/@graphorin/security/functions/registerResolver.md)

***

### RegisterResolverOptions

Re-exports [RegisterResolverOptions](/api/@graphorin/security/interfaces/RegisterResolverOptions.md)

***

### resolveSecret

Re-exports [resolveSecret](/api/@graphorin/security/functions/resolveSecret.md)

***

### SecretAccessDeniedError

Re-exports [SecretAccessDeniedError](/api/@graphorin/security/classes/SecretAccessDeniedError.md)

***

### SecretRefParseError

Re-exports [SecretRefParseError](/api/@graphorin/security/classes/SecretRefParseError.md)

***

### SecretRefParseErrorKind

Re-exports [SecretRefParseErrorKind](/api/@graphorin/security/type-aliases/SecretRefParseErrorKind.md)

***

### SecretRefValidationResult

Re-exports [SecretRefValidationResult](/api/@graphorin/security/interfaces/SecretRefValidationResult.md)

***

### SecretRequiredError

Re-exports [SecretRequiredError](/api/@graphorin/security/classes/SecretRequiredError.md)

***

### SecretResolutionError

Re-exports [SecretResolutionError](/api/@graphorin/security/classes/SecretResolutionError.md)

***

### SecretsAuditAction

Re-exports [SecretsAuditAction](/api/@graphorin/security/type-aliases/SecretsAuditAction.md)

***

### SecretsAuditActor

Re-exports [SecretsAuditActor](/api/@graphorin/security/interfaces/SecretsAuditActor.md)

***

### SecretsAuditDecision

Re-exports [SecretsAuditDecision](/api/@graphorin/security/type-aliases/SecretsAuditDecision.md)

***

### SecretsAuditEvent

Re-exports [SecretsAuditEvent](/api/@graphorin/security/interfaces/SecretsAuditEvent.md)

***

### SecretsStoreKind

Re-exports [SecretsStoreKind](/api/@graphorin/security/type-aliases/SecretsStoreKind.md)

***

### SecretsStoreStatus

Re-exports [SecretsStoreStatus](/api/@graphorin/security/interfaces/SecretsStoreStatus.md)

***

### SecretValue

Re-exports [SecretValue](/api/@graphorin/security/classes/SecretValue.md)

***

### SecretValueAuditEvent

Re-exports [SecretValueAuditEvent](/api/@graphorin/security/type-aliases/SecretValueAuditEvent.md)

***

### setLiteralAllowed

Re-exports [setLiteralAllowed](/api/@graphorin/security/functions/setLiteralAllowed.md)

***

### setRefStoreLookup

Re-exports [setRefStoreLookup](/api/@graphorin/security/functions/setRefStoreLookup.md)

***

### setVaultAdapter

Re-exports [setVaultAdapter](/api/@graphorin/security/functions/setVaultAdapter.md)

***

### StrictSecretsUnavailableError

Re-exports [StrictSecretsUnavailableError](/api/@graphorin/security/classes/StrictSecretsUnavailableError.md)

***

### ToolSecretsContext

Re-exports [ToolSecretsContext](/api/@graphorin/security/interfaces/ToolSecretsContext.md)

***

### UnknownSchemeError

Re-exports [UnknownSchemeError](/api/@graphorin/security/classes/UnknownSchemeError.md)

***

### unregisterResolver

Re-exports [unregisterResolver](/api/@graphorin/security/functions/unregisterResolver.md)

***

### validateSecretRefs

Re-exports [validateSecretRefs](/api/@graphorin/security/functions/validateSecretRefs.md)

***

### ValidateSecretRefsOptions

Re-exports [ValidateSecretRefsOptions](/api/@graphorin/security/interfaces/ValidateSecretRefsOptions.md)

***

### VaultAdapter

Re-exports [VaultAdapter](/api/@graphorin/security/type-aliases/VaultAdapter.md)

***

### vaultResolver

Re-exports [vaultResolver](/api/@graphorin/security/variables/vaultResolver.md)

***

### withChildToolSecretsContext

Re-exports [withChildToolSecretsContext](/api/@graphorin/security/functions/withChildToolSecretsContext.md)

***

### withSecret

Re-exports [withSecret](/api/@graphorin/security/functions/withSecret.md)

***

### WithSecretAuditEvent

Re-exports [WithSecretAuditEvent](/api/@graphorin/security/interfaces/WithSecretAuditEvent.md)

***

### withToolSecretsContext

Re-exports [withToolSecretsContext](/api/@graphorin/security/functions/withToolSecretsContext.md)
