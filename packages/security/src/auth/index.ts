/**
 * Server token-auth surface for `@graphorin/security`. Combines the
 * token format primitives, the scope grammar, the verify pipeline,
 * and the token CRUD library functions used by `@graphorin/server`
 * and the CLI.
 *
 * @packageDocumentation
 */

export {
  _getAuthAuditListenerCountForTesting,
  _resetAuthAuditListenersForTesting,
  type AuthAuditAction,
  type AuthAuditActor,
  type AuthAuditDecision,
  type AuthAuditEvent,
  type AuthAuditListener,
  emitAuthAudit,
  onAuthAudit,
} from './audit-emitter.js';
export {
  type CreatedToken,
  type CreateTokenOptions,
  createToken,
  generatePepper,
  listTokens,
  rekeyTokens,
  revokeToken,
  rotateToken,
  type TokenMetadata,
} from './crud.js';
export {
  ScopeParseError,
  TokenFormatError,
  type TokenFormatErrorKind,
  TokenLockedOutError,
  TokenVerifyOverloadError,
  WeakPepperError,
} from './errors.js';
export {
  type ParsedScope,
  parseScope,
  SCOPE_CATALOGUE,
  scopeMatches,
  scopeSetMatches,
  tryParseScope,
  validateScopeSet,
} from './scope.js';
export {
  crc32,
  DEFAULT_TOKEN_PREFIX,
  encodeBase62Bytes,
  encodeBase62Integer,
  type GenerateRawTokenOptions,
  generateRawToken,
  type ParsedToken,
  type ParseTokenOptions,
  parseToken,
  TOKEN_CHECKSUM_LENGTH,
  TOKEN_ENTROPY_BYTES,
  TOKEN_ENTROPY_LENGTH,
  TOKEN_ENVIRONMENTS,
  TOKEN_VERSION,
  type TokenEnvironment,
  verifyOffline,
} from './token-format.js';
export {
  authorize,
  TokenVerifier,
  type TokenVerifierStatus,
  type VerifiedToken,
  type VerifierOptions,
  type VerifyContext,
  type VerifyFailureReason,
  type VerifyResult,
  verifyToken,
} from './verify.js';
