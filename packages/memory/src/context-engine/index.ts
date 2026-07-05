/**
 * `@graphorin/memory/context-engine` - Phase 10d. The layered
 * six-layer memory-aware system prompt assembler + locale-aware
 * base templates + per-record D2 privacy filter + token budget
 * allocator + per-step tool-catalogue cardinality allocator
 * (RB-44) + in-flight session message-history compaction (RB-46) +
 * D3 / D4 cooperation contract (`ContentOrigin` + `inbound:trust`
 * annotations).
 *
 * The framework is locale-agnostic - no language is privileged in
 * core. Application code can register additional locales via
 * `defineContextLocalePack({ ... })`; missing surfaces fall back
 * to the bundled English default with a one-time WARN per locale.
 *
 * @packageDocumentation
 */

/**
 * Re-export `MemoryMetadata` for ergonomic call-site typing.
 *
 * @stable
 */
export type { MemoryMetadata } from '@graphorin/core';
export {
  annotate,
  CONTENT_ORIGIN_ATTR,
  type ContentAnnotation,
  type ContentOrigin,
  INBOUND_TRUST_ATTR,
  type InboundTrust,
  NON_INBOUND_ORIGINS,
  shouldFireInboundPreamble,
  toSpanAttributes,
} from './annotations.js';
export {
  type AutoRecallStrategy,
  type AutoRecallStrategyContext,
  type AutoRecallTriggerResult,
  defaultLocaleHeuristicStrategy,
  defineAutoRecallStrategy,
} from './auto-recall.js';
export * from './compaction/index.js';
export {
  type AnnotatedPart,
  type AssembledPrompt,
  type AssembleInput,
  type AutoRecallConfig,
  type ContextEngine,
  type ContextEngineConfig,
  createContextEngine,
  type LayerConfig,
  type PrivacyConfig,
  type ResolvedContextEngineConfig,
} from './engine.js';
// The `memory.compile(...)` surface types live in the io-types leaf
// (issue #22); re-exported here so the public import path is
// unchanged.
export type { CompileOptions, CompileScope, MemoryContextBlocks } from './io-types.js';
export {
  type AutoRecallTriggers,
  type BaseTemplateFragments,
  type CompactionSummaryTemplate,
  type ContextLocalePack,
  defineContextLocalePack,
  enLocalePack,
  type InboundSanitizationPreamble,
  type PartialContextLocalePack,
} from './locale-packs/index.js';
export {
  _getLocaleFallbackWarningsForTesting,
  _resetLocaleFallbackWarningsForTesting,
  type LocaleResolverLogger,
  resolveLocalePack,
} from './locale-packs/resolver.js';
export {
  gatherMemoryMetadata,
  type MemoryMetadataDeps,
  renderMetadataBlock,
} from './metadata.js';
export { INBOUND_SANITIZATION_PREAMBLE_EN } from './preambles/inbound-en.js';
export {
  decide as privacyDecide,
  effectiveAcceptsSensitivity,
  type PartitionResult,
  type PrivacyDecision,
  type PrivacyDecisionReason,
  type PrivacyFilterContext,
  partition as partitionBySensitivity,
} from './privacy-filter.js';
export {
  BASE_TEMPLATE_EN_FULL,
  BASE_TEMPLATE_EN_MINIMAL,
} from './templates/base-en.js';
export {
  composeInboundPreamble,
  composeLayer1,
  composeLayer2,
  composeLayer4Skills,
  type MemoryBaseMode,
  type SkillMetadataCard,
} from './templates/composer.js';
export {
  type AllocationResult,
  allocate as allocateTokenBudget,
  DEFAULT_LAYER_PRIORITY,
  type LayerAllocation,
  type LayerCandidate,
  type LayerId,
  type OverflowMode,
  truncateToTokens,
} from './token-budget.js';
export {
  adaptTokenCounter,
  type ContextTokenCounter,
  countMessageTokens,
  HEURISTIC_TOKEN_COUNTER,
  renderMessageText,
} from './token-counter.js';
