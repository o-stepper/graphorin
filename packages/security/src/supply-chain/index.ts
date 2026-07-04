/**
 * Skills supply-chain subsystem of `@graphorin/security`. Implements
 * the install-time defences:
 *
 * - ed25519 signature verification of `SKILL.md`.
 * - `--ignore-scripts` enforcement against npm + git installs.
 * - Operator-managed allow / deny lists with optional framework
 *   denylist hook.
 * - In-memory installation registry consumed by the audit CLI.
 *
 * @packageDocumentation
 */

export {
  _resetSkillInstallationsForTesting,
  auditInstalledSkills,
  recordInstallation,
} from './audit.js';
export {
  _getSupplyChainAuditListenerCountForTesting,
  _resetSupplyChainAuditListenersForTesting,
  emitSupplyChainAudit,
  onSupplyChainAudit,
  type SupplyChainAuditAction,
  type SupplyChainAuditActor,
  type SupplyChainAuditDecision,
  type SupplyChainAuditEvent,
} from './audit-emitter.js';
export {
  GraphorinSupplyChainError,
  SkillInstallDeniedError,
  SkillInstallError,
  SkillManifestParseError,
  SkillSignatureInvalidError,
  SkillSignatureMissingError,
  TrustLevelEscalationError,
} from './errors.js';
export {
  canonicalizeForSignature,
  extractSignatureBlock,
  parseFrontmatter,
  splitFrontmatter,
} from './frontmatter.js';
export {
  type InstallSkillFromGitOptions,
  type InstallSkillFromNpmOptions,
  installSkillFromGit,
  installSkillFromNpm,
} from './installer.js';
export {
  _setPackageManagerForTesting,
  _setPackageManagerRunnerForTesting,
  buildInstallInvocation,
  detectPackageManager,
  type PackageManagerKind,
  type PackageManagerResult,
  type PackageManagerRunner,
  runPackageManager,
} from './package-manager.js';
export {
  _setFrameworkDenylistForTesting,
  assertPolicyAllows,
  evaluateSupplyChainPolicy,
  matchesGlob,
  resolveTrustPolicy,
} from './policy.js';
export {
  _setPublicKeyFetcherForTesting,
  _setSigstoreVerifierForTesting,
  type PublicKeyFetcher,
  type SigstoreVerifier,
  type SkillTrustRoot,
  type VerifySkillSignatureOptions,
  verifySkillSignature,
} from './signature.js';
export type {
  ResolvedSkillTrustPolicy,
  SkillInstallationStatus,
  SkillPublicKeyRef,
  SkillSignatureBlock,
  SkillSignatureVerificationResult,
  SkillSource,
  SkillTrustLevel,
  SupplyChainDecision,
  SupplyChainPolicy,
} from './types.js';
