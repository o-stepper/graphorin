/**
 * Secrets foundations for `@graphorin/security`. Exposes the
 * runtime-safe `SecretValue` wrapper, the strict `SecretRef` URI
 * parser, the pluggable resolver registry, four built-in
 * `SecretsStore` implementations, the per-tool ACL primitives, and the
 * `createSecretsStore({ kind: 'auto' })` factory with downgrade audit.
 *
 * @packageDocumentation
 */

export {
  // Test-only:
  _resetWithSecretListenersForTesting,
  computeEffectiveAllowlist,
  enforceSecretAcl,
  getActiveToolSecretsContext,
  onWithSecretAudit,
  type ToolSecretsContext,
  type WithSecretAuditEvent,
  type WithSecretListener,
  withChildToolSecretsContext,
  withSecret,
  withToolSecretsContext,
} from './acl.js';
export {
  // Test-only:
  _getSecretsAuditListenerCountForTesting,
  _resetSecretsAuditListenersForTesting,
  emitSecretsAudit,
  onSecretsAudit,
  type SecretsAuditAction,
  type SecretsAuditActor,
  type SecretsAuditDecision,
  type SecretsAuditEvent,
  type SecretsAuditListener,
} from './audit-emitter.js';
export {
  GraphorinSecretsError,
  LiteralSecretsForbiddenError,
  MemoryStoreInProductionError,
  MissingPeerDependencyError,
  SecretAccessDeniedError,
  SecretRefParseError,
  type SecretRefParseErrorKind,
  SecretRequiredError,
  SecretResolutionError,
  StrictSecretsUnavailableError,
  UnknownSchemeError,
} from './errors.js';
export {
  // Test-only:
  _resetSecretsFactoryForTesting,
  type CreateSecretsStoreOptions,
  composeChain,
  createSecretsStore,
  detectHeadless,
  getActiveSecretsStore,
  getSecretsStoreStatus,
  parseSecretsSourceEnv,
  type SecretsStoreKind,
  type SecretsStoreStatus,
} from './factory.js';

export {
  _resetFileResolverWarningsForTesting,
  _resetLiteralResolverForTesting,
  // Test-only:
  _resetResolversForTesting,
  _setArgon2idForTesting,
  _setKeyringEntryCtorForTesting,
  type Argon2idFn,
  areBuiltinsInstalled,
  decryptBundle,
  deriveAesKey,
  ENCRYPTED_FILE_MAGIC,
  encryptedFileResolver,
  envResolver,
  fileResolver,
  getResolver,
  installBuiltinResolvers,
  isLiteralAllowed,
  KEYRING_DEFAULT_SERVICE,
  type KeyringEntryCtor,
  keyringResolver,
  listResolverSchemes,
  literalResolver,
  type RefStoreLookup,
  type RegisterResolverOptions,
  refResolver,
  registerResolver,
  resolveSecret,
  setLiteralAllowed,
  setRefStoreLookup,
  setVaultAdapter,
  unregisterResolver,
  type VaultAdapter,
  vaultResolver,
} from './resolvers/index.js';
export {
  AUTHORITY_OPTIONAL_SCHEMES,
  assertNotNakedString,
  BUILTIN_SCHEMES,
  describeParseErrorKind,
  getQueryParam,
  getQueryParamAll,
  getQueryParamRequired,
  OPAQUE_ONLY_SCHEMES,
  type ParsedSecretRef,
  parseAuthority,
  parseOrAssert,
  parseSecretRef,
  type SecretRefValidationResult,
  type ValidateSecretRefsOptions,
  validateSecretRefs,
} from './secret-ref.js';
export {
  _resetSecretValueAuditListenersForTesting,
  onSecretValueAudit,
  SecretValue,
  type SecretValueAuditEvent,
  type SecretValueAuditListener,
} from './secret-value.js';
export {
  EncryptedFileSecretsStore,
  type EncryptedFileSecretsStoreOptions,
  EnvSecretsStore,
  type EnvSecretsStoreOptions,
  KeyringSecretsStore,
  type KeyringSecretsStoreOptions,
  MemorySecretsStore,
} from './stores/index.js';
