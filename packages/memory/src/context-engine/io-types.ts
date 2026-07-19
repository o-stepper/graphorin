/**
 * Leaf IO types of the context engine - the shapes that cross the
 * `ContextEngine` boundary (assembly input/output, the resolved
 * config snapshot, and the `memory.compile(...)` surface).
 *
 * Kept in a dependency-leaf module (issue #22): `memory-interface.ts`
 * (the mutually-recursive `Memory` + `ContextEngine` pair) and
 * `engine.ts` (the implementation) both import from here, so neither
 * has to import the other's host module and the package graph stays
 * acyclic. Everything here is re-exported from its original home
 * (`engine.ts` / the context-engine barrel) - no public import path
 * changed.
 *
 * @packageDocumentation
 */

import type {
  LocalProviderTrust,
  MessageContent,
  Sensitivity,
  SessionScope,
} from '@graphorin/core';
import type { ContentAnnotation } from './annotations.js';
import type { AutoRecallStrategy, AutoRecallTriggerResult } from './auto-recall.js';
import type { PrivacyDecisionReason } from './privacy-filter.js';
import type { MemoryBaseMode, SkillMetadataCard } from './templates/composer.js';
import type { AllocationResult } from './token-budget.js';

/**
 * Input to {@link ContextEngine.assemble}.
 *
 * @stable
 */
export interface AssembleInput {
  readonly scope: SessionScope;
  readonly agentId: string;
  readonly sessionId: string;
  readonly runId: string;
  readonly agentInstructions?: string;
  readonly skills?: ReadonlyArray<SkillMetadataCard>;
  readonly proceduralActivation?: {
    readonly topic?: string;
    readonly tags?: ReadonlyArray<string>;
  };
  readonly lastUserMessage?: string;
  readonly autoRecallStrategyOverride?: AutoRecallStrategy;
  /**
   * Optional inbound-trust annotations carried by upstream
   * messages (`session_messages` rows tagged by Phase 12 / Phase
   * 07 / Phase 09). When at least one part has `inboundTrust !==
   * 'trusted' && inboundTrust !== 'n/a'`, the per-step preamble
   * fires (see RB-43 / DEC-159).
   */
  readonly upstreamAnnotations?: ReadonlyArray<ContentAnnotation>;
}

/**
 * Single annotated `MessageContent` part assembled by the engine.
 *
 * @stable
 */
export interface AnnotatedPart {
  readonly content: MessageContent;
  readonly annotation: ContentAnnotation;
}

/**
 * Output of {@link ContextEngine.assemble}.
 *
 * @stable
 */
export interface AssembledPrompt {
  /** Single system message ready for `provider.stream(...)`. */
  readonly systemMessage: { readonly role: 'system'; readonly content: string };
  /**
   * Per-part annotations, in the same order as the assembled
   * system content. Span-only - never serialized to the wire payload.
   */
  readonly annotations: ReadonlyArray<AnnotatedPart>;
  /**
   * Per-layer allocation snapshot. Surfaced for tests + diagnostics.
   */
  readonly layerAllocation: AllocationResult;
  /** Whether the per-step inbound preamble fragment fired this assembly. */
  readonly inboundPreambleFired: boolean;
  /** Privacy-filter counters surfaced to the metadata block. */
  readonly privacyCounters: Readonly<Record<PrivacyDecisionReason, number>>;
  /** Resolved locale id (`'en'` for the default; custom otherwise). */
  readonly localeId: string;
  /** Resolved memory base mode. */
  readonly memoryBaseMode: MemoryBaseMode;
  /** Whether auto-recall was triggered this assembly. */
  readonly autoRecall: AutoRecallTriggerResult;
}

/**
 * Resolved configuration snapshot returned by
 * {@link ContextEngine.config}.
 *
 * @stable
 */
export interface ResolvedContextEngineConfig {
  readonly memoryBaseMode: MemoryBaseMode;
  readonly localeId: string;
  readonly maxContextTokens: number;
  readonly reservedForResponse: number;
  readonly reservedForCompaction: number;
  readonly compactionEnabled: boolean;
  /**
   * Whether compaction can actually fire: `compactionEnabled` **and** a
   * `providerContextWindow` was supplied. `compactionEnabled: true` with
   * `compactionEffective: false` is the honest signal that compaction is
   * configured-on but a no-op for want of a context window.
   */
  readonly compactionEffective: boolean;
  readonly compactionThresholdTokens: number;
  readonly providerContextWindow: number | null;
  readonly providerTrust: LocalProviderTrust;
  readonly cloudUploadConsent: boolean;
  readonly defaultSensitivity: Sensitivity;
}

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
