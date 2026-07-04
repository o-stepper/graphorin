/**
 * Public surface of the auto-compaction subsystem (RB-46).
 *
 * @packageDocumentation
 */

export {
  CLEARED_TOOL_RESULT_MARKER,
  type ClearToolResultsOptions,
  type ClearToolResultsOutcome,
  clearOldToolResults,
  DEFAULT_KEEP_TOOL_USES,
} from './clear-tool-results.js';
export {
  DEFAULT_PRESERVE_RECENT_TURNS,
  type ExecuteCompactionInput,
  executeCompaction,
} from './compactor.js';
export { reanchorPersonaBlock } from './hooks/reanchor-persona-block.js';
export { reanchorPinnedFacts } from './hooks/reanchor-pinned-facts.js';
export { reanchorProjectRules } from './hooks/reanchor-project-rules.js';
export type { HookDeps, NamedPostCompactionHook } from './hooks/types.js';
export {
  buildSummarizerPrompt,
  type CompactionMetadataPayload,
  DEFAULT_SUMMARIZER_DUMP_CHAR_BUDGET,
  type RenderedTemplate,
  renderFinalSummary,
  SUMMARY_TEMPLATE_NAME,
  SUMMARY_TEMPLATE_VERSION,
} from './templates/summary-9-section.js';
export {
  type AutoCompactionDefault,
  DEFAULT_RESERVED_FOR_COMPACTION,
  DEFAULT_RESERVED_FOR_RESPONSE,
  DEFAULT_THRESHOLD_RATIO,
  resolveAutoCompactionDefault,
  resolveTriggerThreshold,
} from './thresholds.js';
export type {
  CompactionConfig,
  CompactionContext,
  CompactionResult,
  CompactionSource,
  CompactionStrategy,
  CompactionSummarizer,
  CompactionTriggerConfig,
  PostCompactionHook,
  PostCompactionHookContext,
} from './types.js';
