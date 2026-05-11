/**
 * `@graphorin/memory/context-engine` — Phase 10d. The layered
 * six-layer memory-aware system prompt assembler + locale-aware
 * base templates + per-record D2 privacy filter + token budget
 * allocator + per-step tool-catalogue cardinality allocator
 * (RB-44) + in-flight session message-history compaction (RB-46) +
 * D3 / D4 cooperation contract (`ContentOrigin` + `inbound:trust`
 * annotations).
 *
 * The framework is locale-agnostic — no language is privileged in
 * core. Application code can register additional locales via
 * `defineContextLocalePack({ ... })`; missing surfaces fall back
 * to the bundled English default with a one-time WARN per locale.
 *
 * @packageDocumentation
 */

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
export * from './tool-budget/index.js';

/**
 * Compile result. Layered into the system prompt by the agent
 * runtime. Preserved as a stable surface from Phase 10a so
 * existing consumers (`memory.compile(scope)`) keep working
 * unchanged after Phase 10d.
 *
 * @stable
 */
export interface MemoryContextBlocks {
  /** XML-rendered working memory blocks, when any. */
  readonly workingBlocks?: string;
  /** Active procedural rules block. */
  readonly rules?: string;
  /** Static narrative base (English by default; locale-aware). */
  readonly base?: string;
  /** Bucketed memory metadata block. */
  readonly metadata?: string;
  /** Optional auto-recalled memory hints. */
  readonly autoRecalled?: string;
  /** Optional `cache_control` hints for prompt-cache aware providers. */
  readonly cacheHints?: ReadonlyArray<string>;
}

/**
 * Per-call options accepted by `memory.compile(...)`.
 *
 * @stable
 */
export interface CompileOptions {
  readonly maxBlocks?: number;
  readonly includeMetadata?: boolean;
  readonly providerAcceptsSensitivity?: ReadonlyArray<'public' | 'internal' | 'secret'>;
}

/**
 * Author-time scope passed through to the context engine.
 *
 * @stable
 */
export type CompileScope = import('@graphorin/core').SessionScope;

/**
 * Re-export `MemoryMetadata` for ergonomic call-site typing.
 *
 * @stable
 */
export type { MemoryMetadata } from '@graphorin/core';
