[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / commands

# commands

Public command entry points. The CLI binary thin-wraps these
helpers; tests + downstream automations consume them directly so
they never spawn a child process to exercise the contract.

Phase 14a shipped: `init` / `migrate` / `start`.
Phase 15 added: `doctor`, `token`, `secrets`, `audit`, `storage`,
`memory`, `consolidator`, `triggers`, `auth`, `pricing`, `skills`,
`traces`, `migrate-export`, `migrate-config`, `guard`, `telemetry`,
`tools lint`.

## References

### AuditCommonOptions

Re-exports [AuditCommonOptions](/api/@graphorin/cli/interfaces/AuditCommonOptions.md)

***

### AuditExportOptions

Re-exports [AuditExportOptions](/api/@graphorin/cli/interfaces/AuditExportOptions.md)

***

### AuditExportResult

Re-exports [AuditExportResult](/api/@graphorin/cli/interfaces/AuditExportResult.md)

***

### AuditPruneOptions

Re-exports [AuditPruneOptions](/api/@graphorin/cli/interfaces/AuditPruneOptions.md)

***

### AuditVerifyResult

Re-exports [AuditVerifyResult](/api/@graphorin/cli/interfaces/AuditVerifyResult.md)

***

### AuthCommonOptions

Re-exports [AuthCommonOptions](/api/@graphorin/cli/interfaces/AuthCommonOptions.md)

***

### AuthListOptions

Re-exports [AuthListOptions](/api/@graphorin/cli/interfaces/AuthListOptions.md)

***

### AuthLoginOptions

Re-exports [AuthLoginOptions](/api/@graphorin/cli/interfaces/AuthLoginOptions.md)

***

### AuthRefreshOptions

Re-exports [AuthRefreshOptions](/api/@graphorin/cli/interfaces/AuthRefreshOptions.md)

***

### AuthRevokeOptions

Re-exports [AuthRevokeOptions](/api/@graphorin/cli/interfaces/AuthRevokeOptions.md)

***

### CONSOLIDATOR\_INVALID\_TIER\_EXIT

Re-exports [CONSOLIDATOR_INVALID_TIER_EXIT](/api/@graphorin/cli/variables/CONSOLIDATOR_INVALID_TIER_EXIT.md)

***

### ConsolidatorCommonOptions

Re-exports [ConsolidatorCommonOptions](/api/@graphorin/cli/interfaces/ConsolidatorCommonOptions.md)

***

### ConsolidatorDlqClearOptions

Re-exports [ConsolidatorDlqClearOptions](/api/@graphorin/cli/interfaces/ConsolidatorDlqClearOptions.md)

***

### ConsolidatorDlqClearResult

Re-exports [ConsolidatorDlqClearResult](/api/@graphorin/cli/interfaces/ConsolidatorDlqClearResult.md)

***

### ConsolidatorDlqEntry

Re-exports [ConsolidatorDlqEntry](/api/@graphorin/cli/interfaces/ConsolidatorDlqEntry.md)

***

### ConsolidatorDlqListOptions

Re-exports [ConsolidatorDlqListOptions](/api/@graphorin/cli/interfaces/ConsolidatorDlqListOptions.md)

***

### ConsolidatorSetTierOptions

Re-exports [ConsolidatorSetTierOptions](/api/@graphorin/cli/interfaces/ConsolidatorSetTierOptions.md)

***

### ConsolidatorStatusResult

Re-exports [ConsolidatorStatusResult](/api/@graphorin/cli/interfaces/ConsolidatorStatusResult.md)

***

### ConsolidatorStopOptions

Re-exports [ConsolidatorStopOptions](/api/@graphorin/cli/interfaces/ConsolidatorStopOptions.md)

***

### DoctorCommandOptions

Re-exports [DoctorCommandOptions](/api/@graphorin/cli/interfaces/DoctorCommandOptions.md)

***

### DoctorReport

Re-exports [DoctorReport](/api/@graphorin/cli/interfaces/DoctorReport.md)

***

### expectedFileModes

Re-exports [expectedFileModes](/api/@graphorin/cli/functions/expectedFileModes.md)

***

### GuardCommonOptions

Re-exports [GuardCommonOptions](/api/@graphorin/cli/interfaces/GuardCommonOptions.md)

***

### GuardExplainOptions

Re-exports [GuardExplainOptions](/api/@graphorin/cli/interfaces/GuardExplainOptions.md)

***

### GuardExplainResult

Re-exports [GuardExplainResult](/api/@graphorin/cli/interfaces/GuardExplainResult.md)

***

### GuardStatusEntry

Re-exports [GuardStatusEntry](/api/@graphorin/cli/interfaces/GuardStatusEntry.md)

***

### InitCommandOptions

Re-exports [InitCommandOptions](/api/@graphorin/cli/interfaces/InitCommandOptions.md)

***

### InitCommandResult

Re-exports [InitCommandResult](/api/@graphorin/cli/interfaces/InitCommandResult.md)

***

### MemoryActivityConflict

Re-exports [MemoryActivityConflict](/api/@graphorin/cli/interfaces/MemoryActivityConflict.md)

***

### MemoryActivityEvent

Re-exports [MemoryActivityEvent](/api/@graphorin/cli/interfaces/MemoryActivityEvent.md)

***

### MemoryActivityOptions

Re-exports [MemoryActivityOptions](/api/@graphorin/cli/interfaces/MemoryActivityOptions.md)

***

### MemoryActivityResult

Re-exports [MemoryActivityResult](/api/@graphorin/cli/interfaces/MemoryActivityResult.md)

***

### MemoryCitingInsight

Re-exports [MemoryCitingInsight](/api/@graphorin/cli/interfaces/MemoryCitingInsight.md)

***

### MemoryCommonOptions

Re-exports [MemoryCommonOptions](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md)

***

### MemoryConflictEntry

Re-exports [MemoryConflictEntry](/api/@graphorin/cli/interfaces/MemoryConflictEntry.md)

***

### MemoryHistoryEntry

Re-exports [MemoryHistoryEntry](/api/@graphorin/cli/interfaces/MemoryHistoryEntry.md)

***

### MemoryInspectEntity

Re-exports [MemoryInspectEntity](/api/@graphorin/cli/interfaces/MemoryInspectEntity.md)

***

### MemoryInspectFact

Re-exports [MemoryInspectFact](/api/@graphorin/cli/interfaces/MemoryInspectFact.md)

***

### MemoryInspectOptions

Re-exports [MemoryInspectOptions](/api/@graphorin/cli/interfaces/MemoryInspectOptions.md)

***

### MemoryInspectResult

Re-exports [MemoryInspectResult](/api/@graphorin/cli/interfaces/MemoryInspectResult.md)

***

### MemoryMigrateOptions

Re-exports [MemoryMigrateOptions](/api/@graphorin/cli/interfaces/MemoryMigrateOptions.md)

***

### MemoryPruneHistoryOptions

Re-exports [MemoryPruneHistoryOptions](/api/@graphorin/cli/interfaces/MemoryPruneHistoryOptions.md)

***

### MemoryPruneHistoryResult

Re-exports [MemoryPruneHistoryResult](/api/@graphorin/cli/interfaces/MemoryPruneHistoryResult.md)

***

### MemoryReviewItem

Re-exports [MemoryReviewItem](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)

***

### MemoryReviewOptions

Re-exports [MemoryReviewOptions](/api/@graphorin/cli/interfaces/MemoryReviewOptions.md)

***

### MemoryReviewResult

Re-exports [MemoryReviewResult](/api/@graphorin/cli/interfaces/MemoryReviewResult.md)

***

### MemoryStatusEmbedder

Re-exports [MemoryStatusEmbedder](/api/@graphorin/cli/interfaces/MemoryStatusEmbedder.md)

***

### MemoryStatusResult

Re-exports [MemoryStatusResult](/api/@graphorin/cli/interfaces/MemoryStatusResult.md)

***

### MemoryWhyOptions

Re-exports [MemoryWhyOptions](/api/@graphorin/cli/interfaces/MemoryWhyOptions.md)

***

### MemoryWhyRecall

Re-exports [MemoryWhyRecall](/api/@graphorin/cli/interfaces/MemoryWhyRecall.md)

***

### MemoryWhyResult

Re-exports [MemoryWhyResult](/api/@graphorin/cli/interfaces/MemoryWhyResult.md)

***

### MigrateCommandOptions

Re-exports [MigrateCommandOptions](/api/@graphorin/cli/interfaces/MigrateCommandOptions.md)

***

### MigrateCommandResult

Re-exports [MigrateCommandResult](/api/@graphorin/cli/interfaces/MigrateCommandResult.md)

***

### MigrateConfigOptions

Re-exports [MigrateConfigOptions](/api/@graphorin/cli/interfaces/MigrateConfigOptions.md)

***

### MigrateConfigResult

Re-exports [MigrateConfigResult](/api/@graphorin/cli/interfaces/MigrateConfigResult.md)

***

### MigrateExportOptions

Re-exports [MigrateExportOptions](/api/@graphorin/cli/interfaces/MigrateExportOptions.md)

***

### MigrateExportResult

Re-exports [MigrateExportResult](/api/@graphorin/cli/interfaces/MigrateExportResult.md)

***

### parseDuration

Re-exports [parseDuration](/api/@graphorin/cli/functions/parseDuration.md)

***

### PricingCommonOptions

Re-exports [PricingCommonOptions](/api/@graphorin/cli/interfaces/PricingCommonOptions.md)

***

### PricingDiffOptions

Re-exports [PricingDiffOptions](/api/@graphorin/cli/interfaces/PricingDiffOptions.md)

***

### PricingLookupOptions

Re-exports [PricingLookupOptions](/api/@graphorin/cli/interfaces/PricingLookupOptions.md)

***

### PricingMissingOptions

Re-exports [PricingMissingOptions](/api/@graphorin/cli/interfaces/PricingMissingOptions.md)

***

### PricingRefreshOptions

Re-exports [PricingRefreshOptions](/api/@graphorin/cli/interfaces/PricingRefreshOptions.md)

***

### PricingStatusResult

Re-exports [PricingStatusResult](/api/@graphorin/cli/interfaces/PricingStatusResult.md)

***

### runAuditExport

Re-exports [runAuditExport](/api/@graphorin/cli/functions/runAuditExport.md)

***

### runAuditPrune

Re-exports [runAuditPrune](/api/@graphorin/cli/functions/runAuditPrune.md)

***

### runAuditVerify

Re-exports [runAuditVerify](/api/@graphorin/cli/functions/runAuditVerify.md)

***

### runAuthList

Re-exports [runAuthList](/api/@graphorin/cli/functions/runAuthList.md)

***

### runAuthLogin

Re-exports [runAuthLogin](/api/@graphorin/cli/functions/runAuthLogin.md)

***

### runAuthRefresh

Re-exports [runAuthRefresh](/api/@graphorin/cli/functions/runAuthRefresh.md)

***

### runAuthRevoke

Re-exports [runAuthRevoke](/api/@graphorin/cli/functions/runAuthRevoke.md)

***

### runAuthStatus

Re-exports [runAuthStatus](/api/@graphorin/cli/functions/runAuthStatus.md)

***

### runConsolidatorDlqClear

Re-exports [runConsolidatorDlqClear](/api/@graphorin/cli/functions/runConsolidatorDlqClear.md)

***

### runConsolidatorDlqList

Re-exports [runConsolidatorDlqList](/api/@graphorin/cli/functions/runConsolidatorDlqList.md)

***

### runConsolidatorSetTier

Re-exports [runConsolidatorSetTier](/api/@graphorin/cli/functions/runConsolidatorSetTier.md)

***

### runConsolidatorStatus

Re-exports [runConsolidatorStatus](/api/@graphorin/cli/functions/runConsolidatorStatus.md)

***

### runConsolidatorStop

Re-exports [runConsolidatorStop](/api/@graphorin/cli/functions/runConsolidatorStop.md)

***

### runDoctor

Re-exports [runDoctor](/api/@graphorin/cli/functions/runDoctor.md)

***

### runGuardExplain

Re-exports [runGuardExplain](/api/@graphorin/cli/functions/runGuardExplain.md)

***

### runGuardStatus

Re-exports [runGuardStatus](/api/@graphorin/cli/functions/runGuardStatus.md)

***

### runInit

Re-exports [runInit](/api/@graphorin/cli/functions/runInit.md)

***

### runMemoryActivity

Re-exports [runMemoryActivity](/api/@graphorin/cli/functions/runMemoryActivity.md)

***

### runMemoryInspect

Re-exports [runMemoryInspect](/api/@graphorin/cli/functions/runMemoryInspect.md)

***

### runMemoryMigrate

Re-exports [runMemoryMigrate](/api/@graphorin/cli/functions/runMemoryMigrate.md)

***

### runMemoryPruneHistory

Re-exports [runMemoryPruneHistory](/api/@graphorin/cli/functions/runMemoryPruneHistory.md)

***

### runMemoryReview

Re-exports [runMemoryReview](/api/@graphorin/cli/functions/runMemoryReview.md)

***

### runMemoryStatus

Re-exports [runMemoryStatus](/api/@graphorin/cli/functions/runMemoryStatus.md)

***

### runMemoryWhy

Re-exports [runMemoryWhy](/api/@graphorin/cli/functions/runMemoryWhy.md)

***

### runMigrate

Re-exports [runMigrate](/api/@graphorin/cli/functions/runMigrate.md)

***

### runMigrateConfig

Re-exports [runMigrateConfig](/api/@graphorin/cli/functions/runMigrateConfig.md)

***

### runMigrateExport

Re-exports [runMigrateExport](/api/@graphorin/cli/functions/runMigrateExport.md)

***

### runPricingDiff

Re-exports [runPricingDiff](/api/@graphorin/cli/functions/runPricingDiff.md)

***

### runPricingLookup

Re-exports [runPricingLookup](/api/@graphorin/cli/functions/runPricingLookup.md)

***

### runPricingMissing

Re-exports [runPricingMissing](/api/@graphorin/cli/functions/runPricingMissing.md)

***

### runPricingRefresh

Re-exports [runPricingRefresh](/api/@graphorin/cli/functions/runPricingRefresh.md)

***

### runPricingStatus

Re-exports [runPricingStatus](/api/@graphorin/cli/functions/runPricingStatus.md)

***

### runSecretsDelete

Re-exports [runSecretsDelete](/api/@graphorin/cli/functions/runSecretsDelete.md)

***

### runSecretsGet

Re-exports [runSecretsGet](/api/@graphorin/cli/functions/runSecretsGet.md)

***

### runSecretsList

Re-exports [runSecretsList](/api/@graphorin/cli/functions/runSecretsList.md)

***

### runSecretsRef

Re-exports [runSecretsRef](/api/@graphorin/cli/functions/runSecretsRef.md)

***

### runSecretsRotate

Re-exports [runSecretsRotate](/api/@graphorin/cli/functions/runSecretsRotate.md)

***

### runSecretsSet

Re-exports [runSecretsSet](/api/@graphorin/cli/functions/runSecretsSet.md)

***

### runSkillsAudit

Re-exports [runSkillsAudit](/api/@graphorin/cli/functions/runSkillsAudit.md)

***

### runSkillsInspect

Re-exports [runSkillsInspect](/api/@graphorin/cli/functions/runSkillsInspect.md)

***

### runSkillsInstall

Re-exports [runSkillsInstall](/api/@graphorin/cli/functions/runSkillsInstall.md)

***

### runSkillsMigrateFrontmatter

Re-exports [runSkillsMigrateFrontmatter](/api/@graphorin/cli/functions/runSkillsMigrateFrontmatter.md)

***

### runStart

Re-exports [runStart](/api/@graphorin/cli/functions/runStart.md)

***

### runStorageBackup

Re-exports [runStorageBackup](/api/@graphorin/cli/functions/runStorageBackup.md)

***

### runStorageCleanupBackups

Re-exports [runStorageCleanupBackups](/api/@graphorin/cli/functions/runStorageCleanupBackups.md)

***

### runStorageEncrypt

Re-exports [runStorageEncrypt](/api/@graphorin/cli/functions/runStorageEncrypt.md)

***

### runStorageRekey

Re-exports [runStorageRekey](/api/@graphorin/cli/functions/runStorageRekey.md)

***

### runStorageStatus

Re-exports [runStorageStatus](/api/@graphorin/cli/functions/runStorageStatus.md)

***

### runTelemetryDisable

Re-exports [runTelemetryDisable](/api/@graphorin/cli/functions/runTelemetryDisable.md)

***

### runTelemetryEnable

Re-exports [runTelemetryEnable](/api/@graphorin/cli/functions/runTelemetryEnable.md)

***

### runTelemetryInspect

Re-exports [runTelemetryInspect](/api/@graphorin/cli/functions/runTelemetryInspect.md)

***

### runTelemetryStatus

Re-exports [runTelemetryStatus](/api/@graphorin/cli/functions/runTelemetryStatus.md)

***

### runTokenCreate

Re-exports [runTokenCreate](/api/@graphorin/cli/functions/runTokenCreate.md)

***

### runTokenList

Re-exports [runTokenList](/api/@graphorin/cli/functions/runTokenList.md)

***

### runTokenRekey

Re-exports [runTokenRekey](/api/@graphorin/cli/functions/runTokenRekey.md)

***

### runTokenRevoke

Re-exports [runTokenRevoke](/api/@graphorin/cli/functions/runTokenRevoke.md)

***

### runTokenRotate

Re-exports [runTokenRotate](/api/@graphorin/cli/functions/runTokenRotate.md)

***

### runTokenVerify

Re-exports [runTokenVerify](/api/@graphorin/cli/functions/runTokenVerify.md)

***

### runToolsLint

Re-exports [runToolsLint](/api/@graphorin/cli/functions/runToolsLint.md)

***

### runTracesPrune

Re-exports [runTracesPrune](/api/@graphorin/cli/functions/runTracesPrune.md)

***

### runTracesStatus

Re-exports [runTracesStatus](/api/@graphorin/cli/functions/runTracesStatus.md)

***

### runTriggersDisable

Re-exports [runTriggersDisable](/api/@graphorin/cli/functions/runTriggersDisable.md)

***

### runTriggersFire

Re-exports [runTriggersFire](/api/@graphorin/cli/functions/runTriggersFire.md)

***

### runTriggersList

Re-exports [runTriggersList](/api/@graphorin/cli/functions/runTriggersList.md)

***

### runTriggersPrune

Re-exports [runTriggersPrune](/api/@graphorin/cli/functions/runTriggersPrune.md)

***

### runTriggersStatus

Re-exports [runTriggersStatus](/api/@graphorin/cli/functions/runTriggersStatus.md)

***

### SecretsCommonOptions

Re-exports [SecretsCommonOptions](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md)

***

### SecretsDeleteOptions

Re-exports [SecretsDeleteOptions](/api/@graphorin/cli/interfaces/SecretsDeleteOptions.md)

***

### SecretsGetOptions

Re-exports [SecretsGetOptions](/api/@graphorin/cli/interfaces/SecretsGetOptions.md)

***

### SecretsGetResult

Re-exports [SecretsGetResult](/api/@graphorin/cli/interfaces/SecretsGetResult.md)

***

### SecretsListOptions

Re-exports [SecretsListOptions](/api/@graphorin/cli/interfaces/SecretsListOptions.md)

***

### SecretsRefOptions

Re-exports [SecretsRefOptions](/api/@graphorin/cli/interfaces/SecretsRefOptions.md)

***

### SecretsRefResult

Re-exports [SecretsRefResult](/api/@graphorin/cli/interfaces/SecretsRefResult.md)

***

### SecretsRotateOptions

Re-exports [SecretsRotateOptions](/api/@graphorin/cli/interfaces/SecretsRotateOptions.md)

***

### SecretsSetOptions

Re-exports [SecretsSetOptions](/api/@graphorin/cli/interfaces/SecretsSetOptions.md)

***

### SecretsSourceFlag

Re-exports [SecretsSourceFlag](/api/@graphorin/cli/type-aliases/SecretsSourceFlag.md)

***

### SkillsAuditOptions

Re-exports [SkillsAuditOptions](/api/@graphorin/cli/interfaces/SkillsAuditOptions.md)

***

### SkillsCommonOptions

Re-exports [SkillsCommonOptions](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md)

***

### SkillsInspectOptions

Re-exports [SkillsInspectOptions](/api/@graphorin/cli/interfaces/SkillsInspectOptions.md)

***

### SkillsInstallOptions

Re-exports [SkillsInstallOptions](/api/@graphorin/cli/interfaces/SkillsInstallOptions.md)

***

### SkillsMigrateFrontmatterOptions

Re-exports [SkillsMigrateFrontmatterOptions](/api/@graphorin/cli/interfaces/SkillsMigrateFrontmatterOptions.md)

***

### SkillsMigrateFrontmatterResult

Re-exports [SkillsMigrateFrontmatterResult](/api/@graphorin/cli/interfaces/SkillsMigrateFrontmatterResult.md)

***

### SkillTrustLevelInput

Re-exports [SkillTrustLevelInput](/api/@graphorin/cli/type-aliases/SkillTrustLevelInput.md)

***

### StartCommandOptions

Re-exports [StartCommandOptions](/api/@graphorin/cli/interfaces/StartCommandOptions.md)

***

### StorageBackupOptions

Re-exports [StorageBackupOptions](/api/@graphorin/cli/interfaces/StorageBackupOptions.md)

***

### StorageBackupResult

Re-exports [StorageBackupResult](/api/@graphorin/cli/interfaces/StorageBackupResult.md)

***

### StorageCleanupBackupsOptions

Re-exports [StorageCleanupBackupsOptions](/api/@graphorin/cli/interfaces/StorageCleanupBackupsOptions.md)

***

### StorageCleanupBackupsResult

Re-exports [StorageCleanupBackupsResult](/api/@graphorin/cli/interfaces/StorageCleanupBackupsResult.md)

***

### StorageCommonOptions

Re-exports [StorageCommonOptions](/api/@graphorin/cli/interfaces/StorageCommonOptions.md)

***

### StorageEncryptOptions

Re-exports [StorageEncryptOptions](/api/@graphorin/cli/interfaces/StorageEncryptOptions.md)

***

### StorageRekeyOptions

Re-exports [StorageRekeyOptions](/api/@graphorin/cli/interfaces/StorageRekeyOptions.md)

***

### StorageStatusResult

Re-exports [StorageStatusResult](/api/@graphorin/cli/interfaces/StorageStatusResult.md)

***

### TelemetryStatusResult

Re-exports [TelemetryStatusResult](/api/@graphorin/cli/interfaces/TelemetryStatusResult.md)

***

### TokenCommonOptions

Re-exports [TokenCommonOptions](/api/@graphorin/cli/interfaces/TokenCommonOptions.md)

***

### TokenCreateOptions

Re-exports [TokenCreateOptions](/api/@graphorin/cli/interfaces/TokenCreateOptions.md)

***

### TokenCreateResult

Re-exports [TokenCreateResult](/api/@graphorin/cli/interfaces/TokenCreateResult.md)

***

### TokenListOptions

Re-exports [TokenListOptions](/api/@graphorin/cli/interfaces/TokenListOptions.md)

***

### TokenRekeyOptions

Re-exports [TokenRekeyOptions](/api/@graphorin/cli/interfaces/TokenRekeyOptions.md)

***

### TokenRevokeOptions

Re-exports [TokenRevokeOptions](/api/@graphorin/cli/interfaces/TokenRevokeOptions.md)

***

### TokenRotateOptions

Re-exports [TokenRotateOptions](/api/@graphorin/cli/interfaces/TokenRotateOptions.md)

***

### TokenVerifyOptions

Re-exports [TokenVerifyOptions](/api/@graphorin/cli/interfaces/TokenVerifyOptions.md)

***

### TokenVerifyResult

Re-exports [TokenVerifyResult](/api/@graphorin/cli/interfaces/TokenVerifyResult.md)

***

### ToolsLintOptions

Re-exports [ToolsLintOptions](/api/@graphorin/cli/interfaces/ToolsLintOptions.md)

***

### ToolsLintReport

Re-exports [ToolsLintReport](/api/@graphorin/cli/interfaces/ToolsLintReport.md)

***

### TracesCommonOptions

Re-exports [TracesCommonOptions](/api/@graphorin/cli/interfaces/TracesCommonOptions.md)

***

### TracesPruneOptions

Re-exports [TracesPruneOptions](/api/@graphorin/cli/interfaces/TracesPruneOptions.md)

***

### TracesPruneResult

Re-exports [TracesPruneResult](/api/@graphorin/cli/interfaces/TracesPruneResult.md)

***

### TracesStatusResult

Re-exports [TracesStatusResult](/api/@graphorin/cli/interfaces/TracesStatusResult.md)

***

### TriggersCommonOptions

Re-exports [TriggersCommonOptions](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md)

***

### TriggersDisableOptions

Re-exports [TriggersDisableOptions](/api/@graphorin/cli/interfaces/TriggersDisableOptions.md)

***

### TriggersFireOptions

Re-exports [TriggersFireOptions](/api/@graphorin/cli/interfaces/TriggersFireOptions.md)

***

### TriggersPruneOptions

Re-exports [TriggersPruneOptions](/api/@graphorin/cli/interfaces/TriggersPruneOptions.md)

***

### TriggersPruneResult

Re-exports [TriggersPruneResult](/api/@graphorin/cli/interfaces/TriggersPruneResult.md)

***

### TriggersStatusOptions

Re-exports [TriggersStatusOptions](/api/@graphorin/cli/interfaces/TriggersStatusOptions.md)
