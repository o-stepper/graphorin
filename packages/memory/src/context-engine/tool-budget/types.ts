/**
 * Public types for the per-step tool-catalogue cardinality
 * allocator (RB-44 / suggested DEC-160).
 *
 * @packageDocumentation
 */

/**
 * Minimal `Tool` shape the allocator consumes. Mirrors the
 * `@graphorin/core` `Tool` interface but narrowed to the fields
 * the budget logic actually inspects (name + description). A
 * structural shape lets callers wire either `Tool` directly or
 * a `RegistryEntry` produced by `@graphorin/tools`.
 *
 * @stable
 */
export interface ToolBudgetEntry {
  readonly name: string;
  readonly description?: string;
}

/**
 * Per-`RunContext` lazy-loaded set bookkeeping. Each entry tracks
 * when the tool was injected (via `tool_search`) and when the
 * model last invoked it. The LRU eviction policy at the cap
 * boundary uses `lastUsedAt` ascending.
 *
 * @stable
 */
export interface LazyLoadedToolEntry {
  readonly toolName: string;
  readonly addedAt: number;
  readonly lastUsedAt: number;
}

/**
 * Pluggable similarity ranker the allocator consults when the
 * eager set exceeds the cap. Mirrors the
 * `ToolRegistry.searchDeferred(...)` shape from `@graphorin/tools`.
 *
 * @stable
 */
export interface ToolRanker {
  search(
    query: string,
    k?: number,
  ): Promise<ReadonlyArray<{ readonly toolName: string; readonly score: number }>>;
}

/**
 * Source classification for the deferral decision. Surfaced on the
 * `tool.retrieval.deferred.total{source}` counter.
 *
 * @stable
 */
export type DeferralSource = 'context-engine-auto' | 'explicit' | 'mcp-server-default';

/**
 * Per-call input to {@link allocateToolCatalogue}.
 *
 * @stable
 */
export interface ToolCatalogueInput {
  /** All eager tools registered against the agent (RB-44 § eager set). */
  readonly eagerTools: ReadonlyArray<ToolBudgetEntry>;
  /** Per-`RunContext` lazy-loaded set carried across steps. */
  readonly lazyLoadedTools: ReadonlyArray<LazyLoadedToolEntry>;
  /**
   * Always-present `tool_search` tool. Optional — when omitted the
   * allocator skips the auto-injection path entirely.
   */
  readonly toolSearch?: ToolBudgetEntry;
  /** Cap on the per-step catalogue cardinality. Default `30`. */
  readonly maxToolsInContext: number;
  /** Last user message (used to derive the synthetic ranking query). */
  readonly lastUserMessage?: string;
  /**
   * Pluggable ranker. When omitted, the allocator preserves
   * registration order (deterministic) and emits the deferral
   * decision per the cap.
   */
  readonly ranker?: ToolRanker;
  /**
   * `prepareStep({ tools })` precedence override. When set, the
   * allocator returns the supplied tools verbatim and bypasses the
   * cap. The lazy-loaded set is unaffected.
   */
  readonly prepareStepOverride?: ReadonlyArray<ToolBudgetEntry>;
}

/**
 * Per-call result of {@link allocateToolCatalogue}.
 *
 * @stable
 */
export interface ToolCatalogueResult {
  /** Visible (eager + lazy + tool_search) tools shipped to the model. */
  readonly visible: ReadonlyArray<ToolBudgetEntry>;
  /** Tools deferred from the per-step catalogue. */
  readonly deferred: ReadonlyArray<ToolBudgetEntry>;
  /** Tools evicted from the lazy-loaded set this step (LRU). */
  readonly evictedLazy: ReadonlyArray<{
    readonly toolName: string;
    readonly reason: 'lru' | 'cap-overflow';
  }>;
  /** Whether `prepareStep({ tools })` precedence bypassed the allocator. */
  readonly prepareStepOverrideApplied: boolean;
  /** Whether the auto-deferral path actually fired this step. */
  readonly autoDeferralFired: boolean;
}
