/**
 * `@graphorin/memory` — seven-tier memory system for the Graphorin
 * framework (MST-13: working / session / episodic / semantic /
 * procedural / shared + the read-only insight tier from P1-1).
 *
 * Surface overview:
 *
 *  - The {@link createMemory} facade that wires every tier sub-module
 *    + the memory tools + the search reranker + the context-engine +
 *    the consolidator.
 *  - Tier sub-modules under `./tiers`: {@link WorkingMemory},
 *    {@link SessionMemory}, {@link EpisodicMemory}, {@link SemanticMemory},
 *    {@link ProceduralMemory}, {@link SharedMemory}, plus the read-only
 *    {@link InsightMemory}.
 *  - Eleven memory tools under `./tools` (plus the gated twelfth,
 *    `deep_recall`, registered only when iterative retrieval is
 *    configured): `block_append`, `block_replace`, `block_rethink`,
 *    `fact_remember`, `fact_search`, `fact_supersede`, `fact_forget`,
 *    `recall_episodes`, `conversation_search`, `fact_history` (P0-2),
 *    `fact_validate` (P1-4).
 *  - The hybrid search composition under `./search`, including the
 *    built-in {@link RRFReranker} (k=60 default) and the
 *    {@link ReRanker} contract.
 *  - The embedder migration runner under `./migration`
 *    ({@link migrateEmbedder} with three coexistence policies).
 *  - Typed errors under `./errors`.
 *
 * Forward-looking surfaces (for ergonomic typing today):
 *
 *  - {@link MemoryContextBlocks} + {@link CompileOptions} from `./context-engine`.
 *  - {@link Consolidator}, {@link ConsolidatorTriggerSpec},
 *    {@link ConsolidatorTier} from `./consolidator`.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.5.0';

export * from './conflict/index.js';
export {
  BudgetExceededError,
  buildInductionRequest,
  CONSOLIDATOR_TIER_DEFAULTS,
  type Consolidator,
  type ConsolidatorBudgetSnapshot,
  type ConsolidatorCatchupPolicy,
  type ConsolidatorCeilings,
  type ConsolidatorConfig,
  type ConsolidatorLastRuns,
  type ConsolidatorPhase,
  type ConsolidatorStatus,
  type ConsolidatorTier,
  type ConsolidatorTriggerReason,
  type ConsolidatorTriggerSpec,
  type CreateConsolidatorOptions,
  CustomTierMisconfiguredError,
  checkSuccessCriteria,
  createConsolidator,
  createConsolidatorPlaceholder,
  createProviderWorkflowInducer,
  DEFAULT_INDUCTION_MAX_TOKENS,
  INDUCTION_SYSTEM_PROMPT,
  type InducedProcedure,
  MAX_PROCEDURE_STEPS,
  MAX_TRAJECTORY_STEPS_SHOWN,
  normalizeInducedProcedure,
  type OnBudgetExceed,
  type ParsedTrigger,
  type PhaseListener,
  type PhaseOutcome,
  ProviderNotConfiguredError,
  parseInducedProcedure,
  parseTriggerSpec,
  type RegisterTriggersOptions,
  type RegisterTriggersResult,
  reasonFromTrigger,
  registerConsolidatorTriggers,
  runWorkflowInduction,
  type SchedulerLike,
  type Trajectory,
  type TrajectoryStep,
  type TriggerDeclarationLike,
  trajectoryFromRunState,
  type VerificationResult,
  type WorkflowInducer,
  type WorkflowInductionOptions,
} from './consolidator/index.js';
export {
  _getLocaleFallbackWarningsForTesting,
  _resetLocaleFallbackWarningsForTesting,
  type AllocationResult,
  type AnnotatedPart,
  type AssembledPrompt,
  type AssembleInput,
  type AutoCompactionDefault,
  type AutoRecallConfig,
  type AutoRecallStrategy,
  type AutoRecallStrategyContext,
  type AutoRecallTriggerResult,
  type AutoRecallTriggers,
  adaptTokenCounter,
  allocateTokenBudget,
  annotate,
  BASE_TEMPLATE_EN_FULL,
  BASE_TEMPLATE_EN_MINIMAL,
  type BaseTemplateFragments,
  buildSummarizerPrompt,
  CLEARED_TOOL_RESULT_MARKER,
  type ClearToolResultsOptions,
  type ClearToolResultsOutcome,
  CONTENT_ORIGIN_ATTR,
  type CompactionConfig,
  type CompactionContext,
  type CompactionMetadataPayload,
  type CompactionResult,
  type CompactionSource,
  type CompactionStrategy,
  type CompactionSummarizer,
  type CompactionSummaryTemplate,
  type CompactionTriggerConfig,
  type CompileOptions,
  type CompileScope,
  type ContentAnnotation,
  type ContentOrigin,
  type ContextEngine,
  type ContextEngineConfig,
  type ContextLocalePack,
  type ContextTokenCounter,
  clearOldToolResults,
  composeInboundPreamble,
  composeLayer1,
  composeLayer2,
  composeLayer4Skills,
  countMessageTokens,
  createContextEngine,
  DEFAULT_LAYER_PRIORITY,
  DEFAULT_PRESERVE_RECENT_TURNS,
  DEFAULT_RESERVED_FOR_COMPACTION,
  DEFAULT_RESERVED_FOR_RESPONSE,
  DEFAULT_THRESHOLD_RATIO,
  defaultLocaleHeuristicStrategy,
  defineAutoRecallStrategy,
  defineContextLocalePack,
  type ExecuteCompactionInput,
  effectiveAcceptsSensitivity,
  enLocalePack,
  executeCompaction,
  gatherMemoryMetadata,
  HEURISTIC_TOKEN_COUNTER,
  INBOUND_SANITIZATION_PREAMBLE_EN,
  INBOUND_TRUST_ATTR,
  type InboundSanitizationPreamble,
  type InboundTrust,
  type LayerAllocation,
  type LayerCandidate,
  type LayerConfig,
  type LayerId,
  type LocaleResolverLogger,
  type MemoryBaseMode,
  type MemoryContextBlocks,
  type MemoryMetadataDeps,
  type NamedPostCompactionHook,
  NON_INBOUND_ORIGINS,
  type OverflowMode,
  type PartialContextLocalePack,
  type PartitionResult,
  type PostCompactionHook,
  type PostCompactionHookContext,
  type PrivacyConfig,
  type PrivacyDecision,
  type PrivacyDecisionReason,
  type PrivacyFilterContext,
  partitionBySensitivity,
  privacyDecide,
  type RenderedTemplate,
  type ResolvedContextEngineConfig,
  reanchorPersonaBlock,
  reanchorPinnedFacts,
  reanchorProjectRules,
  renderFinalSummary,
  renderMessageText,
  renderMetadataBlock,
  resolveAutoCompactionDefault,
  resolveLocalePack,
  resolveTriggerThreshold,
  type SkillMetadataCard,
  SUMMARY_TEMPLATE_NAME,
  SUMMARY_TEMPLATE_VERSION,
  shouldFireInboundPreamble,
  toSpanAttributes,
  truncateToTokens,
} from './context-engine/index.js';
export * from './errors/index.js';
export {
  _resetConsolidatorConfigWarningForTesting,
  type CreateMemoryOptions,
  createMemory,
  type Memory,
} from './facade.js';
export * from './graph/index.js';
export type { ContextualRetrievalMode } from './internal/contextualize.js';
export type {
  ConflictAuditDecision,
  ConflictAuditInputLike,
  ConflictAuditStage,
  ConflictMemoryStoreExt,
  ConsolidatorMemoryStoreExt,
  ConsolidatorRunFinish,
  ConsolidatorRunInput,
  ConsolidatorStatePatch,
  ConsolidatorStateRow,
  DecayMemoryStoreExt,
  DlqBatchInput,
  DlqBatchRow,
  EmbeddedWriteOptions,
  EmbeddingMetaRegistryLike,
  EpisodicMemoryStoreExt,
  InsightListOptions as InsightStoreListOptions,
  InsightMemoryStoreExt,
  InsightSearchStoreOptions,
  MemoryStoreAdapter,
  PendingConflictInputLike,
  PendingConflictRowLike,
  SemanticMemoryStoreExt,
  SessionMemoryStoreExt,
  SessionMessageRecord,
} from './internal/storage-adapter.js';
export * from './migration/index.js';
export * from './search/index.js';
export * from './tiers/index.js';
export {
  type BuildMemoryToolsOptions,
  buildMemoryTools,
  createBlockAppendTool,
  createBlockReplaceTool,
  createBlockRethinkTool,
  createConversationSearchTool,
  createDeepRecallTool,
  createFactForgetTool,
  createFactHistoryTool,
  createFactRememberTool,
  createFactSearchTool,
  createFactSupersedeTool,
  createFactValidateTool,
  createRecallEpisodesTool,
  type MemoryToolDeps,
  type ScopeResolver,
} from './tools/index.js';
