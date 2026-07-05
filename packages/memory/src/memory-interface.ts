/**
 * The mutually-recursive `Memory` + `ContextEngine` interface pair
 * (issue #22). `ContextEngine.assemble` / `compactNow` consume the
 * full `Memory` facade, and `Memory` exposes its `contextEngine` -
 * splitting the two across `facade.ts` and `context-engine/engine.ts`
 * put a type-only cycle into the module graph (facade -> engine ->
 * facade, plus every compaction hook that names `Memory`). Co-locating
 * the pair in this leaf module (importing only IO types, tier
 * surfaces, and other leaves) makes the graph acyclic.
 *
 * Both interfaces are re-exported from their original homes
 * (`facade.ts` and the context-engine barrel) - no public import path
 * changed.
 *
 * @packageDocumentation
 */

import type {
  EmbedderProvider,
  MemoryMetadata,
  Message,
  MessageContent,
  SessionScope,
  Tool,
} from '@graphorin/core';
import type { ConflictPipeline } from './conflict/index.js';
import type { Consolidator } from './consolidator/runtime.js';
import type {
  CompactionResult,
  CompactionSource,
  CompactionSummarizer,
} from './context-engine/compaction/types.js';
import type {
  AssembledPrompt,
  AssembleInput,
  CompileOptions,
  CompileScope,
  MemoryContextBlocks,
  ResolvedContextEngineConfig,
} from './context-engine/io-types.js';
import type { EpisodicMemory } from './tiers/episodic-memory.js';
import type { InsightMemory } from './tiers/insight-memory.js';
import type { ProceduralMemory } from './tiers/procedural-memory.js';
import type { SemanticMemory } from './tiers/semantic-memory.js';
import type { SessionMemory } from './tiers/session-memory.js';
import type { SharedMemory } from './tiers/shared-memory.js';
import type { WorkingMemory } from './tiers/working-memory.js';

/**
 * Public surface of the {@link ContextEngine} instance returned by
 * {@link createContextEngine}.
 *
 * @stable
 */
export interface ContextEngine {
  /** Assemble the layered system prompt for a single step. */
  assemble(memory: Memory, input: AssembleInput): Promise<AssembledPrompt>;
  /**
   * Trigger evaluation primitive used by Phase 12 (agent runtime)
   * at the top of every step. Returns `true` when the in-flight
   * buffer's token count crosses the per-provider trigger
   * threshold. Pass `precomputedTokens` to amortize the count
   * via the per-message cache surfaced by
   * `SessionMemoryStoreExt.totalCachedTokens(scope)` (DEC-131) -
   * the production hot path is an O(1) comparison when the cache
   * is warm.
   */
  shouldCompact(
    messages: ReadonlyArray<Message>,
    options?: {
      readonly precomputedTokens?: number;
      /**
       * Index of the first COMPACTABLE message (context-engine-04): the
       * caller's pinned, never-compacted system prefix ends here. The
       * SOTA-4 reclaim floor counts only `messages.slice(from)` older
       * turns as reclaimable - without it a large system prompt is
       * counted as reclaimable and the floor fires the summarizer for
       * near-zero real reclaim. Default `0` (everything compactable).
       */
      readonly compactableFromIndex?: number;
    },
  ): Promise<boolean>;
  /**
   * Run a compaction call. Phase 12 calls this when the trigger
   * fires (`source: 'auto-trigger'`) or the operator invokes
   * `agent.compact(...)` (`source: 'manual'`).
   */
  compactNow(input: {
    readonly scope: SessionScope;
    readonly runId: string;
    readonly sessionId: string;
    readonly agentId: string;
    readonly source: CompactionSource;
    readonly messages: ReadonlyArray<Message>;
    readonly memory: Memory;
    readonly summarizer?: CompactionSummarizer;
    /** Per-call override of the strategy's preserve-recent count (CE-3). */
    readonly preserveRecentTurns?: number;
    /** Topic/tags narrowing for the procedural-rules re-anchor hook (CE-6). */
    readonly procedural?: { readonly topic?: string; readonly tags?: ReadonlyArray<string> };
    /**
     * The caller's pinned system prefix - the messages EXCLUDED from
     * `messages` before this call (context-engine-04). Used only for
     * accounting: the anti-thrash guard and the "still above threshold"
     * warning must compare against the FULL post-splice context
     * (prefix + summary + preserved + essentials), or a real system
     * prompt defeats the guard and a summarizer call fires every step
     * at the context edge. Never compacted, never returned.
     */
    readonly prefixMessages?: ReadonlyArray<Message>;
    readonly signal?: AbortSignal;
  }): Promise<{
    readonly result: CompactionResult;
    readonly extraContent: ReadonlyArray<MessageContent>;
    readonly hookFailures: ReadonlyArray<{ readonly hookName: string; readonly reason: string }>;
  }>;
  /** Resolved configuration snapshot. */
  config(): ResolvedContextEngineConfig;
}

/**
 * The facade returned by {@link createMemory}.
 *
 * @stable
 */
export interface Memory {
  readonly working: WorkingMemory;
  readonly session: SessionMemory;
  readonly episodic: EpisodicMemory;
  readonly semantic: SemanticMemory;
  readonly procedural: ProceduralMemory;
  readonly shared: SharedMemory;
  /**
   * Read surface over reflection insights (P1-1). A no-op (returns
   * empty) when the storage adapter does not expose the optional
   * insight surface.
   */
  readonly insights: InsightMemory;
  readonly tools: ReadonlyArray<Tool>;
  readonly consolidator: Consolidator;
  /** The configured conflict pipeline. Surfaced for tests + CLI tooling. */
  readonly conflictPipeline: ConflictPipeline;
  /** The configured context engine (Phase 10d). */
  readonly contextEngine: ContextEngine;
  /** The active embedder, when configured. `null` otherwise. */
  readonly embedder: EmbedderProvider | null;
  /** The canonical id of the active embedder, when configured. */
  embedderId(): string | null;
  /**
   * Compile a system-prompt block bundle. The bundle carries the
   * static fragments per memory tier; the agent runtime consumes
   * the {@link ContextEngine} surface (`memory.contextEngine`)
   * directly for the full six-layer assembly.
   */
  compile(scope: CompileScope, options?: CompileOptions): Promise<MemoryContextBlocks>;
  /** Counter snapshot consumed by Phase 10d's metadata layer. */
  metadata(scope: SessionScope): Promise<MemoryMetadata>;
}
