/**
 * Public command entry points. The CLI binary thin-wraps these
 * helpers; tests + downstream automations consume them directly so
 * they never spawn a child process to exercise the contract.
 *
 * Phase 14a shipped: `init` / `migrate` / `start`.
 * Phase 15 added: `doctor`, `token`, `secrets`, `audit`, `storage`,
 * `memory`, `consolidator`, `triggers`, `auth`, `pricing`, `skills`,
 * `traces`, `migrate-export`, `migrate-config`, `guard`, `telemetry`,
 * `tools lint`.
 *
 * @packageDocumentation
 */

export {
  type AuditCommonOptions,
  type AuditExportOptions,
  type AuditExportResult,
  type AuditPruneOptions,
  type AuditVerifyResult,
  runAuditExport,
  runAuditPrune,
  runAuditVerify,
} from './audit.js';
export {
  type AuthCommonOptions,
  type AuthListOptions,
  type AuthLoginOptions,
  type AuthRefreshOptions,
  type AuthRevokeOptions,
  runAuthList,
  runAuthLogin,
  runAuthRefresh,
  runAuthRevoke,
  runAuthStatus,
} from './auth.js';
export {
  CONSOLIDATOR_INVALID_TIER_EXIT,
  type ConsolidatorCommonOptions,
  type ConsolidatorDlqClearOptions,
  type ConsolidatorDlqClearResult,
  type ConsolidatorDlqEntry,
  type ConsolidatorDlqListOptions,
  type ConsolidatorSetTierOptions,
  type ConsolidatorStatusResult,
  type ConsolidatorStopOptions,
  runConsolidatorDlqClear,
  runConsolidatorDlqList,
  runConsolidatorSetTier,
  runConsolidatorStatus,
  runConsolidatorStop,
} from './consolidator.js';
export {
  type DoctorCommandOptions,
  type DoctorReport,
  expectedFileModes,
  runDoctor,
} from './doctor.js';
export {
  type GuardCommonOptions,
  type GuardExplainOptions,
  type GuardExplainResult,
  type GuardStatusEntry,
  runGuardExplain,
  runGuardStatus,
} from './guard.js';
export { type InitCommandOptions, type InitCommandResult, runInit } from './init.js';
export {
  type MemoryActivityConflict,
  type MemoryActivityEvent,
  type MemoryActivityOptions,
  type MemoryActivityResult,
  type MemoryCitingInsight,
  type MemoryCommonOptions,
  type MemoryConflictEntry,
  type MemoryHistoryEntry,
  type MemoryInspectEntity,
  type MemoryInspectFact,
  type MemoryInspectOptions,
  type MemoryInspectResult,
  type MemoryMigrateOptions,
  type MemoryPruneHistoryOptions,
  type MemoryPruneHistoryResult,
  type MemoryReviewItem,
  type MemoryReviewOptions,
  type MemoryReviewResult,
  type MemoryStatusEmbedder,
  type MemoryStatusResult,
  type MemoryWhyOptions,
  type MemoryWhyRecall,
  type MemoryWhyResult,
  runMemoryActivity,
  runMemoryInspect,
  runMemoryMigrate,
  runMemoryPruneHistory,
  runMemoryReview,
  runMemoryStatus,
  runMemoryWhy,
} from './memory.js';
export { type MigrateCommandOptions, type MigrateCommandResult, runMigrate } from './migrate.js';
export {
  type MigrateConfigOptions,
  type MigrateConfigResult,
  runMigrateConfig,
} from './migrate-config.js';
export {
  type MigrateExportOptions,
  type MigrateExportResult,
  runMigrateExport,
} from './migrate-export.js';
export {
  type PricingCommonOptions,
  type PricingDiffOptions,
  type PricingLookupOptions,
  type PricingMissingOptions,
  type PricingRefreshOptions,
  type PricingStatusResult,
  runPricingDiff,
  runPricingLookup,
  runPricingMissing,
  runPricingRefresh,
  runPricingStatus,
} from './pricing.js';
export {
  runSecretsDelete,
  runSecretsGet,
  runSecretsList,
  runSecretsRef,
  runSecretsRotate,
  runSecretsSet,
  type SecretsCommonOptions,
  type SecretsDeleteOptions,
  type SecretsGetOptions,
  type SecretsGetResult,
  type SecretsListOptions,
  type SecretsRefOptions,
  type SecretsRefResult,
  type SecretsRotateOptions,
  type SecretsSetOptions,
} from './secrets.js';
export {
  runSkillsAudit,
  runSkillsInspect,
  runSkillsInstall,
  runSkillsMigrateFrontmatter,
  type SkillsAuditOptions,
  type SkillsCommonOptions,
  type SkillsInspectOptions,
  type SkillsInstallOptions,
  type SkillsMigrateFrontmatterOptions,
  type SkillsMigrateFrontmatterResult,
  type SkillTrustLevelInput,
} from './skills.js';
export { runStart, type SecretsSourceFlag, type StartCommandOptions } from './start.js';
export {
  runStorageBackup,
  runStorageCleanupBackups,
  runStorageCompact,
  runStorageEncrypt,
  runStorageRekey,
  runStorageStatus,
  type StorageBackupOptions,
  type StorageBackupResult,
  type StorageCleanupBackupsOptions,
  type StorageCleanupBackupsResult,
  type StorageCommonOptions,
  type StorageCompactOptions,
  type StorageCompactResult,
  type StorageEncryptOptions,
  type StorageRekeyOptions,
  type StorageStatusResult,
} from './storage.js';
export {
  runTelemetryDisable,
  runTelemetryEnable,
  runTelemetryInspect,
  runTelemetryStatus,
  type TelemetryStatusResult,
} from './telemetry.js';
export {
  parseDuration,
  runTokenCreate,
  runTokenList,
  runTokenRekey,
  runTokenRevoke,
  runTokenRotate,
  runTokenVerify,
  type TokenCommonOptions,
  type TokenCreateOptions,
  type TokenCreateResult,
  type TokenListOptions,
  type TokenRekeyOptions,
  type TokenRevokeOptions,
  type TokenRotateOptions,
  type TokenVerifyOptions,
  type TokenVerifyResult,
} from './token.js';
export {
  runToolsLint,
  type ToolsLintOptions,
  type ToolsLintReport,
} from './tools-lint.js';
export {
  runTracesPrune,
  runTracesStatus,
  type TracesCommonOptions,
  type TracesPruneOptions,
  type TracesPruneResult,
  type TracesStatusResult,
} from './traces.js';
export {
  runTriggersDisable,
  runTriggersFire,
  runTriggersList,
  runTriggersPrune,
  runTriggersStatus,
  type TriggersCommonOptions,
  type TriggersDisableOptions,
  type TriggersFireOptions,
  type TriggersPruneOptions,
  type TriggersPruneResult,
  type TriggersStatusOptions,
} from './triggers.js';
