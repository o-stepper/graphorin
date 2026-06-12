/**
 * Audit-log surface for `@graphorin/security`. Provides the
 * tamper-evident chain primitives (`appendAudit`, `verifyAuditChain`,
 * `pruneAudit`, `exportAudit`), the `AuditDb` lifecycle plumbing, the
 * binding registry, and the secrets-layer bridge that turns
 * `SecretsAuditEvent`s into chain entries.
 *
 * @packageDocumentation
 */

export {
  appendAudit,
  computeAuditHash,
  GENESIS_PREV_HASH,
} from './append.js';
export {
  _resetAuditDbBindingsForTesting,
  type AuditDb,
  type AuditDbBinding,
  type AuditDbBindingId,
  getDefaultAuditDbBinding,
  listAuditDbBindings,
  type OpenAuditDbOptions,
  openAuditDb,
  registerAuditDbBinding,
} from './audit-db.js';
export {
  type AuthBridgeTeardown,
  type BridgeAuthToAuditOptions,
  bridgeAuthToAudit,
} from './auth-bridge.js';
export { canonicalJson } from './canonical-json.js';
export {
  AuditChainBrokenError,
  AuditDbCipherUnavailableError,
  AuditPayloadSerializationError,
} from './errors.js';
export {
  type AuditExportWriter,
  type ExportAuditOptions,
  exportAudit,
} from './export.js';
export {
  type BridgeMemoryGuardToAuditOptions,
  bridgeMemoryGuardToAudit,
  type MemoryGuardBridgeTeardown,
} from './memory-guard-bridge.js';
export {
  type BridgeOAuthToAuditOptions,
  bridgeOAuthToAudit,
  type OAuthBridgeTeardown,
} from './oauth-bridge.js';
export {
  type PruneAuditLogEvent,
  type PruneAuditOptions,
  type PruneAuditResult,
  pruneAudit,
} from './prune.js';
export {
  type BridgeSecretsToAuditOptions,
  bridgeSecretsToAudit,
  type SecretsBridgeTeardown,
} from './secrets-bridge.js';
export {
  type BridgeSupplyChainToAuditOptions,
  bridgeSupplyChainToAudit,
  type SupplyChainBridgeTeardown,
} from './supply-chain-bridge.js';
export type {
  AuditAction,
  AuditActor,
  AuditActorKind,
  AuditChainVerifyResult,
  AuditContext,
  AuditDecision,
  AuditEntryInput,
  StoredAuditEntry,
} from './types.js';
export { verifyAuditChain } from './verify-chain.js';
