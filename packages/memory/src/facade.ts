/**
 * `createMemory()` — the facade that wires every six-tier sub-module +
 * the nine memory tools + the search reranker + the context engine
 * stubs + the consolidator placeholder.
 *
 * @packageDocumentation
 */

import type {
  EmbedderProvider,
  MemoryMetadata,
  Provider,
  SessionScope,
  Tool,
  Tracer,
} from '@graphorin/core';
import { NOOP_TRACER } from '@graphorin/core';
import {
  type ConflictPipeline,
  type ConflictPipelineOptions,
  createConflictPipeline,
} from './conflict/index.js';
import {
  type Consolidator,
  type ConsolidatorCeilings,
  type ConsolidatorPhase,
  type ConsolidatorTier,
  type ConsolidatorTriggerSpec,
  createConsolidator,
  createConsolidatorPlaceholder,
  type OnBudgetExceed,
  type PhaseListener,
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
import { bindEmbedder } from './internal/embedder-binding.js';
import type { EmbeddingMetaRegistryLike, MemoryStoreAdapter } from './internal/storage-adapter.js';
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
  /** Embedder provider (default: none — vector search is disabled). */
  readonly embedder?: EmbedderProvider;
  /** Pre-declared working blocks (idempotent — re-defining is a no-op). */
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
   * Resolver that produces the live {@link SessionScope} for each
   * memory-tool invocation. Defaults to a closure that throws — the
   * agent runtime overrides it in Phase 12.
   */
  readonly resolveScope?: ScopeResolver;
  /**
   * Consolidator configuration. When omitted (or `enabled: false`)
   * the facade installs the Phase 10a no-op placeholder so consumers
   * can still type their interactions without paying the runtime
   * cost. Pass `enabled: true` (or any non-`tier: 'free'` settings)
   * to construct the production runtime from
   * `@graphorin/memory/consolidator`.
   */
  readonly consolidator?: {
    readonly enabled?: boolean;
    readonly triggers?: ReadonlyArray<ConsolidatorTriggerSpec>;
    readonly tier?: ConsolidatorTier;
    readonly phases?: ReadonlyArray<ConsolidatorPhase>;
    readonly ceilings?: Partial<ConsolidatorCeilings>;
    readonly onExceed?: OnBudgetExceed;
    readonly cheapModel?: string | null;
    readonly deepModel?: string | null;
    readonly noiseFilters?: ReadonlyArray<'default' | 'minimal' | 'none'>;
    readonly lockWaitMs?: number;
    readonly decayTauDays?: number;
    readonly decayArchiveThreshold?: number;
    readonly maxStandardBatchSize?: number;
    readonly maxDeepConflictsPerRun?: number;
    readonly dlqMaxRetries?: number;
    readonly dlqBaseBackoffMs?: number;
    readonly dlqMaxBackoffMs?: number;
    /** Auto-form quarantined episodes from processed slices (P1-2). Per-tier default. */
    readonly formEpisodes?: boolean;
    /** Score episode importance via the consolidator LLM (P1-2). Per-tier default. */
    readonly importanceScoring?: boolean;
    /** Run the deep-phase reflection pass synthesizing cited insights (P1-1). Per-tier default. */
    readonly reflection?: boolean;
    /** Accumulated-importance threshold at which reflection fires (P1-1). */
    readonly importanceThreshold?: number;
    /** Upper bound on salient questions reflection asks per pass (P1-1). */
    readonly reflectionMaxQuestions?: number;
    readonly defaultScope?: SessionScope;
    readonly provider?: Provider | null;
    /** Override the wall clock — used by tests. */
    readonly now?: () => number;
    /** Stable id seed — used by tests. */
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
          'Pass `resolveScope` to createMemory({...}) — the agent runtime supplies one in Phase 12.',
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
  const semantic = new SemanticMemory({
    store: options.store,
    tracer,
    embedder,
    embedderIdProvider,
    reranker,
    conflictPipeline,
  });
  const procedural = new ProceduralMemory({ store: options.store, tracer });
  const shared = new SharedMemory({ store: options.store, tracer });
  const insights = new InsightMemory({ store: options.store, tracer });

  const tools = buildMemoryTools({
    working,
    session,
    episodic,
    semantic,
    procedural,
    shared,
    resolveScope,
  });

  const consolidatorOpts = options.consolidator;
  const consolidator: Consolidator = buildConsolidator(
    consolidatorOpts,
    options.store,
    semantic,
    episodic,
    tracer,
  );
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
  // with full provider context). The privacy filter only fires
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
    const rules = await options.store.procedural.list(scope);
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
    tracer,
    ...(opts.provider !== undefined ? { provider: opts.provider } : {}),
    ...(opts.now !== undefined ? { now: opts.now } : {}),
    ...(opts.randomId !== undefined ? { randomId: opts.randomId } : {}),
    ...(opts.triggers !== undefined ? { triggers: opts.triggers } : {}),
    ...(opts.tier !== undefined ? { tier: opts.tier } : {}),
    ...(opts.phases !== undefined ? { phases: opts.phases } : {}),
    ...(opts.ceilings !== undefined ? { ceilings: opts.ceilings } : {}),
    ...(opts.onExceed !== undefined ? { onExceed: opts.onExceed } : {}),
    ...(opts.cheapModel !== undefined ? { cheapModel: opts.cheapModel } : {}),
    ...(opts.deepModel !== undefined ? { deepModel: opts.deepModel } : {}),
    ...(opts.noiseFilters !== undefined ? { noiseFilters: opts.noiseFilters } : {}),
    ...(opts.lockWaitMs !== undefined ? { lockWaitMs: opts.lockWaitMs } : {}),
    ...(opts.decayTauDays !== undefined ? { decayTauDays: opts.decayTauDays } : {}),
    ...(opts.decayArchiveThreshold !== undefined
      ? { decayArchiveThreshold: opts.decayArchiveThreshold }
      : {}),
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
    ...(opts.reflection !== undefined ? { reflection: opts.reflection } : {}),
    ...(opts.importanceThreshold !== undefined
      ? { importanceThreshold: opts.importanceThreshold }
      : {}),
    ...(opts.reflectionMaxQuestions !== undefined
      ? { reflectionMaxQuestions: opts.reflectionMaxQuestions }
      : {}),
    ...(opts.defaultScope !== undefined ? { defaultScope: opts.defaultScope } : {}),
  });
  if (opts.onPhaseFinished !== undefined) {
    consolidator.onPhaseFinished(opts.onPhaseFinished);
  }
  return consolidator;
}

function shouldEnableConsolidator(opts: NonNullable<CreateMemoryOptions['consolidator']>): boolean {
  if (opts.enabled === false) return false;
  if (opts.enabled === true) return true;
  // Implicit enable: any non-default option that signals real use.
  return (
    opts.tier !== undefined ||
    opts.phases !== undefined ||
    opts.ceilings !== undefined ||
    opts.cheapModel !== undefined ||
    opts.deepModel !== undefined ||
    opts.provider !== undefined ||
    opts.onPhaseFinished !== undefined ||
    opts.defaultScope !== undefined
  );
}
