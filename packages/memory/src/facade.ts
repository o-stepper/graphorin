/**
 * `createMemory()` - the facade that wires every tier sub-module (the
 * seven-tier system) + the eleven (+1 gated) memory tools + the search
 * reranker + the context engine
 * stubs + the consolidator placeholder.
 *
 * @packageDocumentation
 */

import type {
  EmbedderProvider,
  MemoryMetadata,
  Provider,
  SessionScope,
  Tracer,
} from '@graphorin/core';
import { NOOP_TRACER } from '@graphorin/core';
import { type ConflictPipelineOptions, createConflictPipeline } from './conflict/index.js';
import {
  type Consolidator,
  type ConsolidatorCeilings,
  type ConsolidatorPhase,
  type ConsolidatorTier,
  type ConsolidatorTriggerSpec,
  createConsolidator,
  createConsolidatorPlaceholder,
  createProviderWorkflowInducer,
  type OnBudgetExceed,
  type PhaseListener,
  type SalienceWeights,
} from './consolidator/index.js';
import { createContextEngine } from './context-engine/engine.js';
import type {
  CompileOptions,
  CompileScope,
  ContextEngine,
  ContextEngineConfig,
  MemoryContextBlocks,
} from './context-engine/index.js';
import { enLocalePack } from './context-engine/locale-packs/index.js';
import { resolveLocalePack } from './context-engine/locale-packs/resolver.js';
import { gatherMemoryMetadata, renderMetadataBlock } from './context-engine/metadata.js';
import { partition as partitionBySensitivity } from './context-engine/privacy-filter.js';
import { composeLayer1 } from './context-engine/templates/composer.js';
import { type EntityResolutionConfig, EntityResolver } from './graph/entity-resolver.js';
import type { ContextualRetrievalMode } from './internal/contextualize.js';
import { bindEmbedder } from './internal/embedder-binding.js';
import type { EmbeddingMetaRegistryLike, MemoryStoreAdapter } from './internal/storage-adapter.js';
import type { Memory } from './memory-interface.js';
import { createProviderRetrievalGrader } from './search/iterative.js';
import { createProviderQueryTransformer } from './search/query-transform.js';
import { RRFReranker } from './search/rrf.js';
import type { ReRanker } from './search/types.js';
import { EpisodicMemory } from './tiers/episodic-memory.js';
import { InsightMemory } from './tiers/insight-memory.js';
import { ProceduralMemory } from './tiers/procedural-memory.js';
import { SemanticMemory } from './tiers/semantic-memory.js';
import { SessionMemory } from './tiers/session-memory.js';
import { SharedMemory } from './tiers/shared-memory.js';
import { type BlockDefinition, WorkingMemory } from './tiers/working-memory.js';
import { buildMemoryTools, type ScopeResolver } from './tools/index.js';

/**
 * Options accepted by {@link createMemory}.
 *
 * @stable
 */
export interface CreateMemoryOptions {
  /** Storage adapter (default: `@graphorin/store-sqlite`'s `MemoryStore`). */
  readonly store: MemoryStoreAdapter;
  /** Embedder registry. The default sqlite store exposes one as `sqlite.embeddings`. */
  readonly embeddings: EmbeddingMetaRegistryLike;
  /** Embedder provider (default: none - vector search is disabled). */
  readonly embedder?: EmbedderProvider;
  /** Pre-declared working blocks (idempotent - re-defining is a no-op). */
  readonly workingBlocks?: ReadonlyArray<BlockDefinition>;
  /**
   * Tracer used for every `memory.*` span. Defaults to the no-op
   * tracer from `@graphorin/core` so unit tests do not need to wire
   * the observability stack.
   */
  readonly tracer?: Tracer;
  /** Override the reranker used by `SemanticMemory.search`. */
  readonly reranker?: ReRanker;
  /**
   * Contextual-retrieval mode for the write path (P1-3). `'late-chunk'`
   * (default) prepends a deterministic, offline situating context
   * (entities / timeframe / topics, derived from the fact's own
   * structured fields) to the text that is embedded + FTS-indexed, so a
   * terse fact stays findable; the canonical `text` is preserved. `'off'`
   * indexes the bare text. The `'llm'` enrichment is **not** available on
   * the hot path - it is a consolidator-only opt-in configured via
   * `consolidator: { contextualRetrieval: 'llm' }`.
   */
  readonly contextualRetrieval?: 'off' | 'late-chunk';
  /**
   * Query transformation for retrieval (P2-3, opt-in). When supplied,
   * `SemanticMemory.search(..., { multiQuery })` fans the query into
   * reworded variants (multi-query / RAG-Fusion) and `{ hyde }` adds a
   * hypothetical-answer embedding - both via one cheap LLM call on the
   * given provider, fused through the existing RRF reranker. Omitted (the
   * default) ⇒ search stays **offline + single-shot** and the
   * `multiQuery` / `hyde` search options become silent no-ops. Reserve it
   * for retrieval-heavy recall, not every search (it adds provider
   * latency).
   */
  readonly queryTransform?: {
    /** Cheap provider used to rewrite the query / write the HyDE passage. */
    readonly provider: Provider;
    /** Hard ceiling on reworded variants requested per call. Default 5. */
    readonly maxVariants?: number;
    /** Output-token ceiling per transform call. Default 256. */
    readonly maxTokens?: number;
  };
  /**
   * Relation-graph entity resolution (P2-1). When `entityResolution` is
   * `true` **and** the storage adapter exposes a `graph` surface (the
   * default `@graphorin/store-sqlite` does), `remember(...)` resolves a
   * fact's subject / object to canonical entities and links them, so
   * `search(..., { expandHops: 1 })` can traverse relationships. Omitted
   * (the default) ⇒ facts still carry s/p/o but form no entity links and
   * the write path stays offline + unchanged. Dedup is lexical +
   * embedding (offline, via the configured embedder); LLM adjudication of
   * ambiguous merges is a further opt-in that needs `provider`.
   */
  readonly graph?: EntityResolutionConfig & {
    /** Enable entity resolution + linking on write. Default `false`. */
    readonly entityResolution?: boolean;
    /** Provider for opt-in LLM adjudication of ambiguous merges. */
    readonly provider?: Provider;
  };
  /**
   * Agentic / iterative retrieval (P2-4, opt-in). When supplied,
   * `SemanticMemory.searchIterative(...)` and the gated `deep_recall`
   * tool can grade a retrieved set on the given provider and, for queries
   * judged hard, reformulate + retrieve again (widening to one-hop graph
   * expansion) up to `maxIterations`, abstaining instead of confabulating
   * when memory is insufficient. Omitted (the default) ⇒ `searchIterative`
   * stays a single difficulty-gated pass with **no provider call**, and
   * `deep_recall` is **not** registered (the tool surface stays at the
   * canonical eleven). Reserve it for hard multi-hop / temporal recall -
   * it adds provider latency per pass.
   */
  readonly iterativeRetrieval?: {
    /** Cheap provider used to grade retrieved memories + reformulate. */
    readonly provider: Provider;
    /** Default total-pass cap (clamped to `[1, 5]`). Default 3. */
    readonly maxIterations?: number;
    /** Output-token ceiling per grade call. Default 256. */
    readonly maxTokens?: number;
  };
  /**
   * Opt-in workflow induction (P2-2). When set, `ProceduralMemory.induce(...)`
   * distils a reusable, value-abstracted procedure from a successful agent
   * trajectory and stores it **quarantined** + `provenance: 'induction'`.
   * Omitted (the default) ⇒ `induce(...)` throws
   * {@link ProcedureInductionNotConfiguredError} and the procedural tier
   * stays pure offline CRUD - no provider call.
   */
  readonly procedureInduction?: {
    /** Provider used to abstract trajectory values into a procedure. */
    readonly provider: Provider;
    /** Output-token ceiling per induction call. Default 512. */
    readonly maxTokens?: number;
  };
  /**
   * Promotion-by-demonstrated-success for quarantined induced
   * procedures (MCON-2 part 4). Fully offline - orthogonal to
   * `procedureInduction` (no provider needed). When configured,
   * `procedural.recordOutcome(scope, id, true)` increments the rule's
   * persistent success counter and promotes it into `activate()` once
   * `afterSuccesses` verified reuses accumulate; the injection gate
   * still refuses flagged texts. Omitted ⇒ outcomes are counted but
   * nothing auto-promotes.
   */
  readonly procedurePromotion?: {
    /** Successful demonstrated reuses required before promotion (≥ 1). */
    readonly afterSuccesses: number;
  };
  /**
   * Register the gated `runbook_search` tool (D3) so the model can look
   * up validated procedures by task description (content recall over
   * procedural memory, returning whole runbooks). Fully offline - the
   * default `@graphorin/store-sqlite` adapter serves it from the rules
   * FTS index (migration 028); adapters without the index degrade to an
   * in-memory lexical scan. Default `false` - the tool surface stays at
   * the canonical eleven.
   */
  readonly runbookSearch?: boolean;
  /**
   * Resolver that produces the live {@link SessionScope} for each
   * memory-tool invocation. Defaults to a closure that throws - the
   * agent runtime overrides it in Phase 12.
   */
  readonly resolveScope?: ScopeResolver;
  /**
   * Consolidator configuration. When omitted, empty, or
   * `enabled: false`, the facade installs the Phase 10a no-op
   * placeholder so consumers can still type their interactions without
   * paying the runtime cost. ANY other setting - including offline
   * knobs like `decayCapacity` or `contextualRetrieval` - implicitly
   * enables the production runtime (MST-4); `enabled: false` together
   * with other settings warns once and keeps the placeholder.
   */
  readonly consolidator?: {
    readonly enabled?: boolean;
    readonly triggers?: ReadonlyArray<ConsolidatorTriggerSpec>;
    readonly tier?: ConsolidatorTier;
    readonly phases?: ReadonlyArray<ConsolidatorPhase>;
    readonly ceilings?: Partial<ConsolidatorCeilings>;
    readonly onExceed?: OnBudgetExceed;
    /**
     * USD pricer for phase LLM usage (memory-consolidation-02) - wire
     * to `@graphorin/pricing` so `maxCostPerDay` can actually trip.
     */
    readonly priceUsage?: (usage: { promptTokens: number; completionTokens: number }) => number;
    /** Provider routed to the standard phase when set (MCON-7); falls back to `provider`. */
    readonly cheapProvider?: Provider | null;
    /** Provider routed to the deep + reflection passes when set (MCON-7). */
    readonly deepProvider?: Provider | null;
    readonly cheapModel?: string | null;
    readonly deepModel?: string | null;
    readonly noiseFilters?: ReadonlyArray<'default' | 'minimal' | 'none'>;
    readonly lockWaitMs?: number;
    readonly decayTauDays?: number;
    readonly decayArchiveThreshold?: number;
    /** Capacity-bounded eviction target for the light phase (X-1). Default unbounded. */
    readonly decayCapacity?: number | null;
    /** Weights for the multi-signal salience score (X-1). */
    readonly salienceWeights?: SalienceWeights;
    readonly maxStandardBatchSize?: number;
    readonly maxDeepConflictsPerRun?: number;
    readonly dlqMaxRetries?: number;
    readonly dlqBaseBackoffMs?: number;
    readonly dlqMaxBackoffMs?: number;
    /** Auto-form quarantined episodes from processed slices (P1-2). Per-tier default. */
    readonly formEpisodes?: boolean;
    /** Score episode importance via the consolidator LLM (P1-2). Per-tier default. */
    readonly importanceScoring?: boolean;
    /** Opt in to auto-promotion of injection-clean extraction facts (MCON-2). Default off. */
    readonly autoPromoteExtraction?: boolean;
    /** Run the deep-phase reflection pass synthesizing cited insights (P1-1). Per-tier default. */
    readonly reflection?: boolean;
    /** Accumulated-importance threshold at which reflection fires (P1-1). */
    readonly importanceThreshold?: number;
    /** Upper bound on salient questions reflection asks per pass (P1-1). */
    readonly reflectionMaxQuestions?: number;
    /**
     * Contextual retrieval for standard-phase fact writes (P1-3).
     * `'llm'` opts into one budgeted cheap-model call per write to author
     * a situating prefix (consolidator-only); `'late-chunk'` (default)
     * and `'off'` defer to the write-path mode. Per-tier default.
     */
    readonly contextualRetrieval?: ContextualRetrievalMode;
    /**
     * Maintain the learned-context digest block (D3): after each deep
     * phase, one budgeted LLM call rewrites the reserved
     * `learned_context` working block (previous digest + recent
     * episodes / active insights / procedures), so the assembled system
     * prompt carries a compact standing summary. Default `false` at
     * every tier (Wave-D trial).
     */
    readonly learnedContext?: boolean;
    /** Character bound for the learned-context digest (D3). Default `1200`. */
    readonly learnedContextMaxChars?: number;
    readonly defaultScope?: SessionScope;
    readonly provider?: Provider | null;
    /** Override the wall clock - used by tests. */
    readonly now?: () => number;
    /** Stable id seed - used by tests. */
    readonly randomId?: () => string;
    /** Subscribe to phase-finished events. */
    readonly onPhaseFinished?: PhaseListener;
  };
  /**
   * Conflict pipeline configuration (Phase 10b). Default: enabled,
   * English locale pack, thresholds `0.95 / 0.85 / 0.4`. Pass
   * `{ mode: 'off' }` to bypass the pipeline entirely (logs a one-shot
   * WARN per process per the spec).
   */
  readonly conflictPipeline?: ConflictPipelineOptions;
  /**
   * Context engine configuration (Phase 10d). The engine assembles
   * the layered six-layer system prompt; `memory.compile(scope)`
   * delegates to it for the working blocks + rules + metadata
   * fragments. When omitted, a default engine is created (English
   * locale; `'full'` base mode; no auto-recall; conservative
   * `'public-tls'` provider trust).
   */
  readonly contextEngine?: ContextEngineConfig;
}

// The `Memory` interface is co-located with `ContextEngine` in
// memory-interface.ts (issue #22 - the pair is mutually recursive and
// keeping it here put a type-only cycle into the module graph).
// Re-exported so `import type { Memory } from './facade.js'` and the
// public barrel keep working unchanged.
export type { Memory } from './memory-interface.js';

/**
 * Wire every memory subsystem in one call. Returns the typed
 * `Memory` facade ready to be passed into `createAgent({...})`.
 *
 * @stable
 */
export function createMemory(options: CreateMemoryOptions): Memory {
  const tracer = options.tracer ?? NOOP_TRACER;
  const reranker: ReRanker = options.reranker ?? new RRFReranker();
  const resolveScope: ScopeResolver =
    options.resolveScope ??
    (() => {
      throw new TypeError(
        '[graphorin/memory] memory tool invoked without a scope resolver. ' +
          'Pass `resolveScope` to createMemory({...}) - the agent runtime supplies one in Phase 12.',
      );
    });

  let activeEmbedderId: string | null = null;
  if (options.embedder !== undefined) {
    activeEmbedderId = bindEmbedder(options.embedder, options.embeddings);
  }
  const embedder = options.embedder ?? null;
  const embedderIdProvider = (): string | null => activeEmbedderId;

  const working = new WorkingMemory({ store: options.store, tracer });
  for (const block of options.workingBlocks ?? []) {
    working.define(block);
  }
  const session = new SessionMemory({ store: options.store, tracer });
  const episodic = new EpisodicMemory({
    store: options.store,
    tracer,
    embedder,
    embedderIdProvider,
  });
  const conflictPipeline = createConflictPipeline(options.conflictPipeline ?? {});
  // P2-3: build the (opt-in) query transformer from the supplied provider.
  // Absent ⇒ `null` ⇒ search stays offline + single-shot.
  const queryTransformer =
    options.queryTransform !== undefined
      ? createProviderQueryTransformer(options.queryTransform.provider, {
          ...(options.queryTransform.maxVariants !== undefined
            ? { maxVariants: options.queryTransform.maxVariants }
            : {}),
          ...(options.queryTransform.maxTokens !== undefined
            ? { maxTokens: options.queryTransform.maxTokens }
            : {}),
        })
      : null;
  // P2-1: build the (opt-in) entity resolver. Requires `graph.entityResolution`
  // *and* a graph-capable adapter; absent ⇒ `null` ⇒ writes carry s/p/o but
  // form no entity links and the write path stays offline + unchanged.
  const graphStore = options.store.graph;
  const entityResolver =
    options.graph?.entityResolution === true && graphStore !== undefined
      ? new EntityResolver({
          store: graphStore,
          embedder,
          embedderId: embedderIdProvider,
          ...(options.graph.provider !== undefined ? { provider: options.graph.provider } : {}),
          config: {
            ...(options.graph.mergeThreshold !== undefined
              ? { mergeThreshold: options.graph.mergeThreshold }
              : {}),
            ...(options.graph.adjudicateThreshold !== undefined
              ? { adjudicateThreshold: options.graph.adjudicateThreshold }
              : {}),
            ...(options.graph.llmAdjudication !== undefined
              ? { llmAdjudication: options.graph.llmAdjudication }
              : {}),
          },
        })
      : null;
  // P2-4: build the (opt-in) retrieval grader. Absent ⇒ `null` ⇒
  // `searchIterative` runs a single difficulty-gated pass (no provider
  // call) and the `deep_recall` tool is not registered.
  const grader =
    options.iterativeRetrieval !== undefined
      ? createProviderRetrievalGrader(options.iterativeRetrieval.provider, {
          ...(options.iterativeRetrieval.maxTokens !== undefined
            ? { maxTokens: options.iterativeRetrieval.maxTokens }
            : {}),
        })
      : null;
  const semantic = new SemanticMemory({
    store: options.store,
    tracer,
    embedder,
    embedderIdProvider,
    reranker,
    conflictPipeline,
    ...(options.contextualRetrieval !== undefined
      ? { contextualRetrieval: options.contextualRetrieval }
      : {}),
    ...(queryTransformer !== null ? { queryTransformer } : {}),
    ...(entityResolver !== null ? { entityResolver } : {}),
    ...(grader !== null ? { grader } : {}),
    ...(options.iterativeRetrieval?.maxIterations !== undefined
      ? { iterativeMaxIterations: options.iterativeRetrieval.maxIterations }
      : {}),
    // C5: the same weights drive eviction salience and rank-time trust.
    ...(options.consolidator?.salienceWeights !== undefined
      ? { trustWeights: options.consolidator.salienceWeights }
      : {}),
  });
  // P2-2: build the (opt-in) workflow inducer. Absent ⇒ `null` ⇒
  // `ProceduralMemory.induce(...)` throws and the tier stays offline CRUD.
  // MCON-15: induction spend is recorded into the consolidator budget -
  // the consolidator is constructed AFTER the inducer, so the callback
  // routes through a slot filled below (placeholder ⇒ no-op).
  let consolidatorForSpend: Consolidator | null = null;
  const inducer =
    options.procedureInduction !== undefined
      ? createProviderWorkflowInducer(options.procedureInduction.provider, {
          ...(options.procedureInduction.maxTokens !== undefined
            ? { maxTokens: options.procedureInduction.maxTokens }
            : {}),
          onUsage: (usage) => {
            consolidatorForSpend?.recordExternalSpend(usage.promptTokens + usage.completionTokens);
          },
        })
      : null;
  const procedural = new ProceduralMemory({
    store: options.store,
    tracer,
    ...(inducer !== null ? { inducer } : {}),
    // MCON-2 part 4: opt-in promotion-by-demonstrated-success.
    ...(options.procedurePromotion?.afterSuccesses !== undefined
      ? { promoteAfterSuccesses: options.procedurePromotion.afterSuccesses }
      : {}),
  });
  const shared = new SharedMemory({ store: options.store, tracer });
  const insights = new InsightMemory({ store: options.store, tracer });

  const tools = buildMemoryTools(
    {
      working,
      session,
      episodic,
      semantic,
      procedural,
      shared,
      resolveScope,
    },
    // P2-4: the gated `deep_recall` tool is registered only when a grader
    // is configured - the offline default stays at exactly eleven tools.
    // D3: `runbook_search` is a second gated appendix, opt-in via
    // `runbookSearch: true`.
    {
      includeDeepRecall: grader !== null,
      includeRunbookSearch: options.runbookSearch === true,
    },
  );

  const consolidatorOpts = options.consolidator;
  const consolidator: Consolidator = buildConsolidator(
    consolidatorOpts,
    options.store,
    semantic,
    episodic,
    working,
    tracer,
  );
  consolidatorForSpend = consolidator;
  const contextEngineConfig = options.contextEngine ?? {};
  const contextEngine: ContextEngine = createContextEngine(contextEngineConfig);
  const resolved = contextEngine.config();
  const localePack =
    contextEngineConfig.locale === undefined
      ? enLocalePack
      : typeof contextEngineConfig.locale === 'string'
        ? contextEngineConfig.locale === enLocalePack.id
          ? enLocalePack
          : resolveLocalePack({ id: contextEngineConfig.locale })
        : resolveLocalePack(contextEngineConfig.locale);

  // The facade's `compile(...)` is the static-fragment surface
  // consumed by callers that do not know the active provider yet
  // (the agent runtime calls `memory.contextEngine.assemble(...)`
  // with full provider context when `autoAssembleContext` is
  // enabled). The privacy filter only fires
  // when the caller explicitly passes `providerAcceptsSensitivity`
  // OR the operator opted into the engine's `privacy` block.
  const privacyOptedIn =
    contextEngineConfig.privacy !== undefined &&
    (contextEngineConfig.privacy.providerAcceptsSensitivity !== undefined ||
      contextEngineConfig.privacy.cloudUploadConsent !== undefined ||
      contextEngineConfig.privacy.providerTrust !== undefined);

  async function compile(
    scope: CompileScope,
    compileOptions: CompileOptions = {},
  ): Promise<MemoryContextBlocks> {
    const out: { -readonly [K in keyof MemoryContextBlocks]: MemoryContextBlocks[K] } = {};
    const blocks = await options.store.working.list(scope);
    // Quarantined (e.g. P2-2-induced) procedures are provisional and must not
    // reach the system prompt - `activate()` already excludes them, and
    // compile() (public `@stable`) must agree or a compile()-based prompt
    // builder ingests unvalidated induction procedures (MST-3).
    const rules = (await options.store.procedural.list(scope)).filter(
      (rule) => rule.status !== 'quarantined',
    );
    const shouldFilter = privacyOptedIn || compileOptions.providerAcceptsSensitivity !== undefined;
    let blocksKept: ReadonlyArray<(typeof blocks)[number]> = blocks;
    let rulesKept: ReadonlyArray<(typeof rules)[number]> = rules;
    if (shouldFilter) {
      const filterContext: Parameters<typeof partitionBySensitivity>[1] = {
        providerTrust: resolved.providerTrust,
        cloudUploadConsent: resolved.cloudUploadConsent,
        defaultSensitivity: resolved.defaultSensitivity,
      };
      if (compileOptions.providerAcceptsSensitivity !== undefined) {
        (
          filterContext as {
            providerAcceptsSensitivity?: ReadonlyArray<'public' | 'internal' | 'secret'>;
          }
        ).providerAcceptsSensitivity = compileOptions.providerAcceptsSensitivity;
      }
      blocksKept = partitionBySensitivity(blocks, filterContext).kept;
      rulesKept = partitionBySensitivity(rules, filterContext).kept;
    }
    const blocksXml = renderWorkingBlocksXml(blocksKept);
    if (blocksXml.length > 0) {
      out.workingBlocks = blocksXml;
    }
    if (rulesKept.length > 0) {
      const lines = ['<memory_rules>'];
      for (const rule of rulesKept) {
        lines.push(`  <rule priority="${rule.priority}">${escapeXml(rule.text)}</rule>`);
      }
      lines.push('</memory_rules>');
      out.rules = lines.join('\n');
    }
    if (compileOptions.includeMetadata !== false) {
      const meta = await metadata(scope);
      out.metadata = renderMetadataBlock(meta);
    }
    out.base = composeLayer1(localePack, resolved.memoryBaseMode);
    return Object.freeze(out);
  }

  async function metadata(scope: SessionScope): Promise<MemoryMetadata> {
    return gatherMemoryMetadata(scope, {
      store: options.store,
      consolidator,
      embedderId: embedderIdProvider,
      localeId: resolved.localeId,
    });
  }

  return Object.freeze({
    working,
    session,
    episodic,
    semantic,
    procedural,
    shared,
    insights,
    tools,
    consolidator,
    conflictPipeline,
    contextEngine,
    embedder,
    embedderId: embedderIdProvider,
    compile,
    metadata,
  });
}

function renderWorkingBlocksXml(
  blocks: ReadonlyArray<{
    readonly label: string;
    readonly value: string;
    readonly description?: string;
  }>,
): string {
  if (blocks.length === 0) return '';
  const lines = ['<memory_blocks>'];
  for (const block of blocks) {
    const description =
      block.description !== undefined ? ` description="${escapeXml(block.description)}"` : '';
    lines.push(`  <block label="${escapeXml(block.label)}"${description}>`);
    lines.push(`    ${escapeXml(block.value)}`);
    lines.push('  </block>');
  }
  lines.push('</memory_blocks>');
  return lines.join('\n');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildConsolidator(
  opts: CreateMemoryOptions['consolidator'],
  store: CreateMemoryOptions['store'],
  semantic: SemanticMemory,
  episodic: EpisodicMemory,
  working: WorkingMemory,
  tracer: Tracer,
): Consolidator {
  if (opts === undefined) {
    return createConsolidatorPlaceholder();
  }
  const enabled = shouldEnableConsolidator(opts);
  if (!enabled) {
    return createConsolidatorPlaceholder({
      ...(opts.triggers !== undefined ? { triggers: opts.triggers } : {}),
      ...(opts.tier !== undefined ? { tier: opts.tier } : {}),
    });
  }
  const consolidator = createConsolidator({
    store,
    semantic,
    episodic,
    working,
    tracer,
    ...(opts.provider !== undefined ? { provider: opts.provider } : {}),
    ...(opts.now !== undefined ? { now: opts.now } : {}),
    ...(opts.randomId !== undefined ? { randomId: opts.randomId } : {}),
    ...(opts.triggers !== undefined ? { triggers: opts.triggers } : {}),
    ...(opts.tier !== undefined ? { tier: opts.tier } : {}),
    ...(opts.phases !== undefined ? { phases: opts.phases } : {}),
    ...(opts.ceilings !== undefined ? { ceilings: opts.ceilings } : {}),
    ...(opts.onExceed !== undefined ? { onExceed: opts.onExceed } : {}),
    ...(opts.priceUsage !== undefined ? { priceUsage: opts.priceUsage } : {}),
    ...(opts.cheapProvider !== undefined ? { cheapProvider: opts.cheapProvider } : {}),
    ...(opts.deepProvider !== undefined ? { deepProvider: opts.deepProvider } : {}),
    ...(opts.cheapModel !== undefined ? { cheapModel: opts.cheapModel } : {}),
    ...(opts.deepModel !== undefined ? { deepModel: opts.deepModel } : {}),
    ...(opts.noiseFilters !== undefined ? { noiseFilters: opts.noiseFilters } : {}),
    ...(opts.lockWaitMs !== undefined ? { lockWaitMs: opts.lockWaitMs } : {}),
    ...(opts.decayTauDays !== undefined ? { decayTauDays: opts.decayTauDays } : {}),
    ...(opts.decayArchiveThreshold !== undefined
      ? { decayArchiveThreshold: opts.decayArchiveThreshold }
      : {}),
    ...(opts.decayCapacity !== undefined ? { decayCapacity: opts.decayCapacity } : {}),
    ...(opts.salienceWeights !== undefined ? { salienceWeights: opts.salienceWeights } : {}),
    ...(opts.maxStandardBatchSize !== undefined
      ? { maxStandardBatchSize: opts.maxStandardBatchSize }
      : {}),
    ...(opts.maxDeepConflictsPerRun !== undefined
      ? { maxDeepConflictsPerRun: opts.maxDeepConflictsPerRun }
      : {}),
    ...(opts.dlqMaxRetries !== undefined ? { dlqMaxRetries: opts.dlqMaxRetries } : {}),
    ...(opts.dlqBaseBackoffMs !== undefined ? { dlqBaseBackoffMs: opts.dlqBaseBackoffMs } : {}),
    ...(opts.dlqMaxBackoffMs !== undefined ? { dlqMaxBackoffMs: opts.dlqMaxBackoffMs } : {}),
    ...(opts.formEpisodes !== undefined ? { formEpisodes: opts.formEpisodes } : {}),
    ...(opts.importanceScoring !== undefined ? { importanceScoring: opts.importanceScoring } : {}),
    ...(opts.autoPromoteExtraction !== undefined
      ? { autoPromoteExtraction: opts.autoPromoteExtraction }
      : {}),
    ...(opts.reflection !== undefined ? { reflection: opts.reflection } : {}),
    ...(opts.importanceThreshold !== undefined
      ? { importanceThreshold: opts.importanceThreshold }
      : {}),
    ...(opts.reflectionMaxQuestions !== undefined
      ? { reflectionMaxQuestions: opts.reflectionMaxQuestions }
      : {}),
    ...(opts.contextualRetrieval !== undefined
      ? { contextualRetrieval: opts.contextualRetrieval }
      : {}),
    ...(opts.learnedContext !== undefined ? { learnedContext: opts.learnedContext } : {}),
    ...(opts.learnedContextMaxChars !== undefined
      ? { learnedContextMaxChars: opts.learnedContextMaxChars }
      : {}),
    ...(opts.defaultScope !== undefined ? { defaultScope: opts.defaultScope } : {}),
  });
  if (opts.onPhaseFinished !== undefined) {
    consolidator.onPhaseFinished(opts.onPhaseFinished);
  }
  return consolidator;
}

let consolidatorConfigIgnoredWarned = false;

/** @internal - test seam for the one-time disabled-config warning. */
export function _resetConsolidatorConfigWarningForTesting(): void {
  consolidatorConfigIgnoredWarned = false;
}

function shouldEnableConsolidator(opts: NonNullable<CreateMemoryOptions['consolidator']>): boolean {
  // MST-4: ANY non-empty consolidator config implicitly enables - the old
  // allow-list silently ignored offline knobs (`decayCapacity`,
  // `formEpisodes`, `reflection`, `contextualRetrieval`, …): the caller
  // got a no-op placeholder while believing the feature was on.
  const keys = Object.keys(opts).filter(
    (k) => k !== 'enabled' && (opts as Record<string, unknown>)[k] !== undefined,
  );
  if (opts.enabled === false) {
    if (keys.length > 0 && !consolidatorConfigIgnoredWarned) {
      consolidatorConfigIgnoredWarned = true;
      process.stderr.write(
        `[graphorin/memory] consolidator config (${keys.join(', ')}) was supplied together with enabled: false - the settings are ignored until the consolidator is enabled.\n`,
      );
    }
    return false;
  }
  if (opts.enabled === true) return true;
  return keys.length > 0;
}
