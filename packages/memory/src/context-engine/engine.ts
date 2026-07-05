/**
 * `ContextEngine` - the layered six-layer system prompt assembler.
 *
 * Combines:
 *
 *  - Layer 1 (`graphorin_memory_base`) educational template
 *  - Layer 2 user-defined `agent_instructions`
 *  - Layer 3 working-memory blocks (filtered through D2 privacy)
 *  - Layer 4 procedural rules + skill metadata cards
 *  - Layer 5 memory-metadata counters
 *  - Layer 6 opt-in auto-recall
 *
 * Cross-cuts:
 *
 *  - D2 privacy filter (sensitivity-tier drop)
 *  - D3 cooperation contract (`ContentOrigin` annotation)
 *  - D4 inbound preamble injection (post cache-breakpoint)
 *  - RB-44 per-step tool-catalogue cardinality allocator (separate axis)
 *  - RB-46 in-flight session message-history compaction (separate axis)
 *
 * @packageDocumentation
 */

import type {
  Fact,
  LocalProviderTrust,
  Message,
  MessageContent,
  Sensitivity,
  SessionScope,
  TokenCounter,
} from '@graphorin/core';
import type { ContextEngine, Memory } from '../memory-interface.js';
import { annotate, type ContentAnnotation, shouldFireInboundPreamble } from './annotations.js';
import {
  type AutoRecallStrategy,
  type AutoRecallTriggerResult,
  defaultLocaleHeuristicStrategy,
} from './auto-recall.js';
import {
  DEFAULT_PRESERVE_RECENT_TURNS,
  type ExecuteCompactionInput,
  executeCompaction,
} from './compaction/compactor.js';
import type { NamedPostCompactionHook } from './compaction/hooks/types.js';
import {
  reanchorPersonaBlock,
  reanchorPinnedFacts,
  reanchorProjectRules,
} from './compaction/index.js';
import { resolveAutoCompactionDefault, resolveTriggerThreshold } from './compaction/thresholds.js';
import type {
  CompactionConfig,
  CompactionResult,
  CompactionSource,
  CompactionStrategy,
  CompactionSummarizer,
  PostCompactionHook,
} from './compaction/types.js';
import type {
  AnnotatedPart,
  AssembledPrompt,
  AssembleInput,
  ResolvedContextEngineConfig,
} from './io-types.js';
import {
  type ContextLocalePack,
  enLocalePack,
  type PartialContextLocalePack,
} from './locale-packs/index.js';
import { resolveLocalePack } from './locale-packs/resolver.js';
import { renderMetadataBlock } from './metadata.js';
import { type PrivacyDecisionReason, decide as privacyDecide } from './privacy-filter.js';
import {
  composeInboundPreamble,
  composeLayer1,
  composeLayer2,
  composeLayer4Skills,
  type MemoryBaseMode,
} from './templates/composer.js';
import {
  allocate as allocateLayers,
  type LayerAllocation,
  type LayerCandidate,
} from './token-budget.js';
import {
  adaptTokenCounter,
  type ContextTokenCounter,
  countMessageTokens,
  HEURISTIC_TOKEN_COUNTER,
} from './token-counter.js';

/**
 * Per-layer cap configuration. Mirrors the documented
 * `ContextEngineConfig.layers.*` fields.
 *
 * @stable
 */
export interface LayerConfig {
  readonly enabled?: boolean;
  readonly cap?: number;
}

/**
 * Auto-recall config knob. `false` disables; `{ topK }` enables
 * the heuristic with a bounded top-K.
 *
 * @stable
 */
export type AutoRecallConfig =
  | false
  | {
      readonly topK?: number;
      /**
       * Minimum fused score a hit must reach to be injected. **Default `0`**
       * (CE-4) - `topK` already bounds the volume. The scale is
       * reranker-dependent: the default RRF reranker fuses the FTS + vector
       * candidate lists as `1/(60 + rank)` per list, so scores top out near
       * `2/(60 + 1) ≈ 0.033` - any positive default would silently drop every
       * hit. Set this only when calibrating against a known reranker's scale.
       */
      readonly threshold?: number;
      readonly strategy?: AutoRecallStrategy;
    };

/**
 * Privacy block of the engine config.
 *
 * @stable
 */
export interface PrivacyConfig {
  readonly cloudUploadConsent?: boolean;
  readonly defaultSensitivity?: Sensitivity;
  readonly providerAcceptsSensitivity?: ReadonlyArray<Sensitivity>;
  readonly providerTrust?: LocalProviderTrust;
}

/**
 * Configuration accepted by {@link createContextEngine}.
 *
 * @stable
 */
export interface ContextEngineConfig {
  /**
   * Layer 1 base-template mode. `'full'` (default) ships the
   * verbose ~250-350 token narrative aimed at general LLMs;
   * `'minimal'` opts top-tier models into the ~80-120 token
   * compact form.
   */
  readonly memoryBaseMode?: MemoryBaseMode;
  /** Default `'en'`. Pluggable via `defineContextLocalePack`. */
  readonly locale?: string | ContextLocalePack | PartialContextLocalePack;
  /** Per-layer enable / cap overrides. */
  readonly layers?: {
    readonly identity?: LayerConfig;
    readonly memoryMetadata?: LayerConfig;
    readonly activeRules?: LayerConfig;
    readonly activeSkills?: LayerConfig;
    readonly workingBlocks?: LayerConfig;
    readonly autoRecall?: LayerConfig & { readonly topK?: number; readonly threshold?: number };
  };
  /** Auto-recall trigger configuration. Default `false`. */
  readonly factsAutoRecall?: AutoRecallConfig;
  /** Privacy-filter configuration. */
  readonly privacy?: PrivacyConfig;
  /** Hard token budget. Default `Number.POSITIVE_INFINITY` (no global cap). */
  readonly maxContextTokens?: number;
  /** Tokens reserved for the model's response. Default `4096`. */
  readonly reservedForResponse?: number;
  /** Tokens reserved for the compaction summarizer call. Default `8192`. */
  readonly reservedForCompaction?: number;
  /** Pluggable token counter. Default heuristic (chars/4). */
  readonly tokenCounter?: TokenCounter | ContextTokenCounter;
  /** Auto-compaction configuration (RB-46). */
  readonly compaction?: false | CompactionConfig;
  /** Active provider's context window; required when compaction is enabled. */
  readonly providerContextWindow?: number;
  /** Default summarizer adapter the auto-trigger uses. */
  readonly summarizer?: CompactionSummarizer;
  /** Wall clock for tests + deterministic compaction. */
  readonly now?: () => number;
}

// The IO shapes (AssembleInput / AnnotatedPart / AssembledPrompt /
// ResolvedContextEngineConfig) live in the io-types leaf and the
// ContextEngine interface itself is co-located with `Memory` in
// memory-interface.ts (issue #22 - the pair is mutually recursive).
// Both are re-exported here so every existing import path keeps
// working unchanged.
export type { ContextEngine } from '../memory-interface.js';
export type {
  AnnotatedPart,
  AssembledPrompt,
  AssembleInput,
  ResolvedContextEngineConfig,
} from './io-types.js';

const DEFAULT_LAYER_CAPS: Readonly<
  Record<keyof Required<NonNullable<ContextEngineConfig['layers']>>, number | undefined>
> = {
  identity: undefined,
  memoryMetadata: undefined,
  activeRules: undefined,
  activeSkills: undefined,
  workingBlocks: undefined,
  autoRecall: undefined,
};

let compactionIneffectiveWarned = false;
let heuristicCounterWarned = false;

/** Emit the "compaction enabled but ineffective" warning at most once (CE-12). */
function warnCompactionIneffective(message: string): void {
  if (compactionIneffectiveWarned) return;
  compactionIneffectiveWarned = true;
  process.stderr.write(`[graphorin/memory] ${message}\n`);
}

/**
 * Test-only - reset the one-time CE-12 compaction warning so a test can assert
 * it fires.
 *
 * @internal
 */
export function _resetCompactionWarningForTesting(): void {
  compactionIneffectiveWarned = false;
}

/** @internal - test seam for the one-time heuristic-counter warning (CE-13). */
export function _resetHeuristicCounterWarningForTesting(): void {
  heuristicCounterWarned = false;
}

/**
 * Emission order for the assembled layers - deliberately **distinct from the
 * truncation priority ladder** (CE-9). Allocation still trims by
 * `DEFAULT_LAYER_PRIORITY` (lowest priority first), but layers are *emitted* in
 * this order so the volatile blocks that change every turn (`memoryMetadata`'s
 * counts, `autoRecall`'s injected facts) sit **after** the stable Layer 1-4
 * prefix (identity / rules / blocks / skills). That keeps the provider's - and a
 * local llama.cpp / vLLM server's - KV-cache breakpoint real: the prefix stays
 * byte-identical across turns even as the message count and recalled facts move.
 */
const LAYER_EMIT_ORDER: Readonly<Record<LayerAllocation['id'], number>> = Object.freeze({
  identity: 0,
  activeRules: 1,
  workingBlocks: 2,
  activeSkills: 3,
  // --- KV-cache breakpoint: everything below changes per turn ---
  memoryMetadata: 4,
  autoRecall: 5,
});

/**
 * Build a ContextEngine instance from the supplied configuration.
 *
 * @stable
 */
export function createContextEngine(config: ContextEngineConfig = {}): ContextEngine {
  const memoryBaseMode = config.memoryBaseMode ?? 'full';
  const localeInput = config.locale;
  const localePack: ContextLocalePack = resolvePackInput(localeInput);
  const localeId = localePack.id;
  const layerCfg = config.layers ?? {};
  const layersEnabled: Record<string, boolean> = {
    identity: layerCfg.identity?.enabled ?? true,
    memoryMetadata: layerCfg.memoryMetadata?.enabled ?? true,
    activeRules: layerCfg.activeRules?.enabled ?? true,
    activeSkills: layerCfg.activeSkills?.enabled ?? true,
    workingBlocks: layerCfg.workingBlocks?.enabled ?? true,
    autoRecall: layerCfg.autoRecall?.enabled ?? true,
  };
  const layerCaps: Record<string, number | undefined> = {
    identity: layerCfg.identity?.cap ?? DEFAULT_LAYER_CAPS.identity,
    memoryMetadata: layerCfg.memoryMetadata?.cap ?? DEFAULT_LAYER_CAPS.memoryMetadata,
    activeRules: layerCfg.activeRules?.cap ?? DEFAULT_LAYER_CAPS.activeRules,
    activeSkills: layerCfg.activeSkills?.cap ?? DEFAULT_LAYER_CAPS.activeSkills,
    workingBlocks: layerCfg.workingBlocks?.cap ?? DEFAULT_LAYER_CAPS.workingBlocks,
    autoRecall: layerCfg.autoRecall?.cap ?? DEFAULT_LAYER_CAPS.autoRecall,
  };
  const factsAutoRecall = config.factsAutoRecall ?? false;
  const reservedForResponse = config.reservedForResponse ?? 4096;
  const reservedForCompaction = config.reservedForCompaction ?? 8192;
  const maxContextTokens = config.maxContextTokens ?? Number.POSITIVE_INFINITY;

  const tokenCounter: ContextTokenCounter = config.tokenCounter
    ? 'count' in config.tokenCounter
      ? adaptTokenCounter(config.tokenCounter)
      : (config.tokenCounter as ContextTokenCounter)
    : HEURISTIC_TOKEN_COUNTER;
  // CE-13: budgeting against a real provider window with the heuristic
  // counter is approximate - say so once instead of failing silently
  // late (the heuristic's failure mode is a provider context-length
  // error before compaction fires).
  if (
    config.tokenCounter === undefined &&
    typeof config.providerContextWindow === 'number' &&
    !heuristicCounterWarned
  ) {
    heuristicCounterWarned = true;
    process.stderr.write(
      '[graphorin/memory] context-engine token counts use the built-in heuristic (chars/4 + dense-script). For production budgeting against a real provider window, pass `contextEngine.tokenCounter` (e.g. the provider package JsTiktokenCounter).\n',
    );
  }

  const privacy = config.privacy ?? {};
  const defaultSensitivity: Sensitivity = privacy.defaultSensitivity ?? 'internal';
  const providerTrust: LocalProviderTrust = privacy.providerTrust ?? 'public-tls';
  const cloudUploadConsent = privacy.cloudUploadConsent ?? false;
  const heuristicStrategy = defaultLocaleHeuristicStrategy(localePack);

  // Compaction config resolution.
  const compactionInput = config.compaction;
  const compactionAutoDefault = resolveAutoCompactionDefault(providerTrust);
  const compactionEnabled =
    compactionInput === false
      ? false
      : compactionInput === undefined
        ? compactionAutoDefault === 'enabled'
        : compactionInput.trigger !== 'never';
  const providerContextWindow = config.providerContextWindow ?? null;
  const triggerSpec =
    compactionInput === false || compactionInput === undefined
      ? undefined
      : compactionInput.trigger;
  const compactionThresholdTokens =
    compactionEnabled && providerContextWindow !== null
      ? resolveTriggerThreshold({
          contextWindow: providerContextWindow,
          ...(triggerSpec !== undefined ? { trigger: triggerSpec } : {}),
          reservedForResponse,
          reservedForCompaction,
        })
      : Number.POSITIVE_INFINITY;
  // CE-12: compaction enabled without a `providerContextWindow` leaves the
  // threshold at Infinity, so `shouldCompact` returns false forever - a
  // silently-dead default-on protection. Surface it: throw if the operator
  // explicitly configured compaction, warn (once) if it is on by the default
  // trust policy. Auto-detecting the window from the provider is not
  // implemented.
  const compactionEffective = compactionEnabled && providerContextWindow !== null;
  if (compactionEnabled && providerContextWindow === null) {
    const message =
      'context-engine compaction is enabled but `providerContextWindow` is not set, so the ' +
      'trigger threshold is Infinity and compaction will never fire. Pass `providerContextWindow` ' +
      "(your model's context window, in tokens) - auto-detection from the provider is not implemented.";
    if (compactionInput !== undefined && compactionInput !== false) {
      throw new Error(`[graphorin/memory] ${message}`);
    }
    warnCompactionIneffective(message);
  }
  const compactionStrategy: CompactionStrategy =
    compactionInput === false ||
    compactionInput === undefined ||
    compactionInput.strategy === undefined
      ? {
          kind: 'summarize-old-preserve-recent',
          preserveRecentTurns: 6,
          templateName: 'summary-sections',
        }
      : compactionInput.strategy;
  // SOTA-4 reclaim-floor: defer a compaction whose older (compactable) portion
  // is below this floor (read from the trigger config; 0 = off, byte-identical).
  const compactionMinReclaimTokens =
    triggerSpec !== undefined && triggerSpec !== 'never'
      ? Math.max(0, triggerSpec.minReclaimTokens ?? 0)
      : 0;
  // How many recent turns the active strategy preserves (the reclaimable portion
  // is everything before them).
  const reclaimPreserveTurns =
    compactionStrategy.kind === 'summarize-old-preserve-recent'
      ? (compactionStrategy.preserveRecentTurns ?? DEFAULT_PRESERVE_RECENT_TURNS)
      : compactionStrategy.kind === 'clear-old-tool-results' &&
          typeof compactionStrategy.summarizeFallback === 'object'
        ? (compactionStrategy.summarizeFallback.preserveRecentTurns ??
          DEFAULT_PRESERVE_RECENT_TURNS)
        : DEFAULT_PRESERVE_RECENT_TURNS;
  const compactionHooks: ReadonlyArray<NamedPostCompactionHook> = resolveDefaultHooks(
    compactionInput === false || compactionInput === undefined
      ? undefined
      : compactionInput.postCompactionHooks,
  );
  const summarizer = config.summarizer;
  const now = config.now ?? Date.now;

  const resolvedConfig: ResolvedContextEngineConfig = Object.freeze({
    memoryBaseMode,
    localeId,
    maxContextTokens,
    reservedForResponse,
    reservedForCompaction,
    compactionEnabled,
    compactionEffective,
    compactionThresholdTokens,
    providerContextWindow,
    providerTrust,
    cloudUploadConsent,
    defaultSensitivity,
  });

  async function assemble(memory: Memory, input: AssembleInput): Promise<AssembledPrompt> {
    // Layer 1 - base template.
    const layer1Text = layersEnabled.identity ? composeLayer1(localePack, memoryBaseMode) : '';
    // Layer 2 - agent instructions.
    const layer2Text = composeLayer2(input.agentInstructions);

    // Layer 3 - working blocks (filter D2).
    const blocks = await memory.working.list(input.scope);
    const blocksKept: Array<(typeof blocks)[number]> = [];
    const privacyCounters: Record<PrivacyDecisionReason, number> = {
      allowed: 0,
      'no-cloud-upload-consent': 0,
      'provider-rejects-internal': 0,
      'provider-rejects-secret': 0,
    };
    for (const block of blocks) {
      const decision = privacyDecide(block.sensitivity, {
        ...(privacy.providerAcceptsSensitivity !== undefined
          ? { providerAcceptsSensitivity: privacy.providerAcceptsSensitivity }
          : {}),
        providerTrust,
        cloudUploadConsent,
        defaultSensitivity,
      });
      privacyCounters[decision.reason] += 1;
      if (decision.decision === 'pass') blocksKept.push(block);
    }
    const layer3Text = layersEnabled.workingBlocks ? renderWorkingBlocks(blocksKept) : '';

    // Layer 4 - procedural rules + skills (filter D2 on rules).
    const rules = await memory.procedural.activate(input.scope, input.proceduralActivation ?? {});
    const rulesKept: Array<(typeof rules)[number]> = [];
    for (const rule of rules) {
      const decision = privacyDecide(rule.sensitivity, {
        ...(privacy.providerAcceptsSensitivity !== undefined
          ? { providerAcceptsSensitivity: privacy.providerAcceptsSensitivity }
          : {}),
        providerTrust,
        cloudUploadConsent,
        defaultSensitivity,
      });
      privacyCounters[decision.reason] += 1;
      if (decision.decision === 'pass') rulesKept.push(rule);
    }
    const layer4RulesText = layersEnabled.activeRules ? renderProceduralRules(rulesKept) : '';
    const layer4SkillsText = layersEnabled.activeSkills
      ? composeLayer4Skills(input.skills ?? [])
      : '';

    // Layer 5 - memory metadata.
    const meta = await memory.metadata(input.scope);
    const layer5Text = layersEnabled.memoryMetadata
      ? renderMetadataBlock(enrichMetadataTags(meta, localeId, memory.embedderId()))
      : '';

    // Layer 6 - auto-recall.
    let autoRecall: AutoRecallTriggerResult = { factsTriggered: false };
    let layer6Text = '';
    if (factsAutoRecall !== false && layersEnabled.autoRecall) {
      const strategy =
        input.autoRecallStrategyOverride ?? factsAutoRecall.strategy ?? heuristicStrategy;
      autoRecall = strategy({
        locale: localeId,
        lastUserMessage: input.lastUserMessage ?? '',
      });
      if (autoRecall.factsTriggered) {
        const topK = factsAutoRecall.topK ?? layerCfg.autoRecall?.topK ?? 5;
        // CE-4: default 0 - rank-based `topK` already bounds the injected
        // volume, and the threshold's scale is reranker-dependent (the default
        // RRF reranker fuses 2 candidate lists, so scores top out near
        // `2/(60+1) ≈ 0.033` and any positive default would silently drop
        // everything). Operators tuning against a known reranker scale can pass
        // an explicit `threshold`.
        const threshold = factsAutoRecall.threshold ?? layerCfg.autoRecall?.threshold ?? 0;
        const hits = await memory.semantic
          .search(input.scope, input.lastUserMessage ?? '', { topK })
          .catch(() => []);
        const facts: Fact[] = [];
        for (const hit of hits) {
          if (hit.score < threshold) continue;
          const decision = privacyDecide(hit.record.sensitivity, {
            ...(privacy.providerAcceptsSensitivity !== undefined
              ? { providerAcceptsSensitivity: privacy.providerAcceptsSensitivity }
              : {}),
            providerTrust,
            cloudUploadConsent,
            defaultSensitivity,
          });
          privacyCounters[decision.reason] += 1;
          if (decision.decision === 'pass') facts.push(hit.record);
        }
        layer6Text = renderAutoRecalledFacts(facts);
      }
    }

    // Token-budget allocation. Layer 1 (`graphorin_memory_base`) and
    // Layer 2 (`agent_instructions`) are concatenated into the
    // single `identity` candidate so they share a priority slot;
    // they are joined with a blank line so the assembled prompt is
    // readable.
    const identityText =
      layer1Text.length > 0 && layer2Text.length > 0
        ? `${layer1Text}\n\n${layer2Text}`
        : layer1Text + layer2Text;
    const candidates: LayerCandidate[] = [
      buildCandidate('identity', identityText, layerCaps.identity),
      buildCandidate('memoryMetadata', layer5Text, layerCaps.memoryMetadata),
      buildCandidate('activeRules', layer4RulesText, layerCaps.activeRules),
      buildCandidate('workingBlocks', layer3Text, layerCaps.workingBlocks),
      buildCandidate('activeSkills', layer4SkillsText, layerCaps.activeSkills),
      buildCandidate('autoRecall', layer6Text, layerCaps.autoRecall),
    ].filter((c) => c.text.length > 0);

    const allocation = await allocateLayers(candidates, maxContextTokens, tokenCounter);

    // D4 inbound preamble - fires on steps containing untrusted upstream parts.
    const preambleFired = shouldFireInboundPreamble(input.upstreamAnnotations ?? []);
    const preambleText = preambleFired ? composeInboundPreamble(localePack) : '';

    // CE-9: emit in stability order (Layer 1-4 prefix, then the cache
    // breakpoint, then the volatile metadata / auto-recall), NOT in the
    // truncation-priority order `allocation.layers` arrives in.
    const assembledLayers = allocation.layers
      .filter((l) => l.text.length > 0)
      .sort((a, b) => LAYER_EMIT_ORDER[a.id] - LAYER_EMIT_ORDER[b.id]);
    const finalParts: string[] = assembledLayers.map((l) => l.text);
    if (preambleText.length > 0) finalParts.push(preambleText);
    const systemContent = finalParts.join('\n\n');

    // Annotations - one per assembled fragment, in the same order
    // as `finalParts` so observers can correlate.
    const annotations: AnnotatedPart[] = assembledLayers.map((layer) => ({
      content: { type: 'text', text: layer.text } as MessageContent,
      annotation: annotationForLayer(layer),
    }));
    if (preambleText.length > 0) {
      annotations.push({
        content: { type: 'text', text: preambleText } as MessageContent,
        annotation: annotate('system:framework', 'n/a'),
      });
    }

    return Object.freeze({
      systemMessage: Object.freeze({ role: 'system' as const, content: systemContent }),
      annotations: Object.freeze(annotations),
      layerAllocation: allocation,
      inboundPreambleFired: preambleFired,
      privacyCounters: Object.freeze(privacyCounters),
      localeId,
      memoryBaseMode,
      autoRecall,
    });
  }

  // CE-7 anti-thrash: after a compaction whose afterTokens still sits at
  // or above the trigger threshold (e.g. huge tool results among the
  // preserved turns), an immediate re-trigger would summarize the
  // previous summary - spend with no reclaim. Track the last outcome and
  // require the buffer to have GROWN past it before firing again.
  let lastCompactionAfterTokens: number | null = null;
  const REARM_GROWTH_TOKENS = 256;

  // C4 (context-engine-06/07 hardening): a persistently-failing summarizer
  // previously re-fired an LLM call at the top of EVERY step (the
  // anti-thrash guard arms only on success). Count consecutive failures -
  // including "successful" passes that did not actually shrink the buffer
  // - retry each pass once with a short backoff, and after
  // MAX_CONSECUTIVE_COMPACTION_FAILURES disable the AUTO trigger until a
  // later compactNow (e.g. a manual compact with a fixed summarizer)
  // succeeds and re-arms it.
  let consecutiveCompactionFailures = 0;
  let autoCompactionDisabledByFailures = false;
  const MAX_CONSECUTIVE_COMPACTION_FAILURES = 3;
  const COMPACTION_RETRY_BACKOFF_MS = 250;

  function recordCompactionFailure(reason: string): void {
    consecutiveCompactionFailures += 1;
    if (
      consecutiveCompactionFailures >= MAX_CONSECUTIVE_COMPACTION_FAILURES &&
      !autoCompactionDisabledByFailures
    ) {
      autoCompactionDisabledByFailures = true;
      process.stderr.write(
        `[graphorin/memory] auto-compaction disabled after ${consecutiveCompactionFailures} consecutive failed passes (last: ${reason}). Manual compactNow() still runs and re-enables the trigger on success.\n`,
      );
    }
  }

  async function shouldCompact(
    messages: ReadonlyArray<Message>,
    options: {
      readonly precomputedTokens?: number;
      readonly compactableFromIndex?: number;
    } = {},
  ): Promise<boolean> {
    if (!compactionEnabled) return false;
    if (autoCompactionDisabledByFailures) return false;
    if (compactionThresholdTokens === Number.POSITIVE_INFINITY) return false;
    const total = options.precomputedTokens ?? (await countMessageTokens(messages, tokenCounter));
    if (total < compactionThresholdTokens) return false;
    if (
      lastCompactionAfterTokens !== null &&
      total <= lastCompactionAfterTokens + REARM_GROWTH_TOKENS
    ) {
      return false;
    }
    // SOTA-4 reclaim-floor: skip when the older (compactable) portion is too
    // small to be worth a summarizer call - avoids compact-thrash at the
    // threshold. Counts only the older slice; cheap relative to the avoided
    // call. context-engine-04: the caller's pinned system prefix
    // (`compactableFromIndex`) is NOT reclaimable and must not be counted -
    // a 10k-token prefix would otherwise satisfy any floor while the body
    // holds near-zero reclaimable tokens.
    if (compactionMinReclaimTokens > 0) {
      const from = Math.max(0, Math.min(options.compactableFromIndex ?? 0, messages.length));
      const olderCount = Math.max(from, messages.length - reclaimPreserveTurns);
      if (olderCount <= from) return false;
      const olderTokens = await countMessageTokens(messages.slice(from, olderCount), tokenCounter);
      if (olderTokens < compactionMinReclaimTokens) return false;
    }
    return true;
  }

  async function compactNow(callInput: {
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
    /** The caller's pinned system prefix - accounting only (context-engine-04). */
    readonly prefixMessages?: ReadonlyArray<Message>;
    readonly signal?: AbortSignal;
  }): Promise<{
    readonly result: CompactionResult;
    readonly extraContent: ReadonlyArray<MessageContent>;
    readonly hookFailures: ReadonlyArray<{ readonly hookName: string; readonly reason: string }>;
  }> {
    const activeSummarizer = callInput.summarizer ?? summarizer;
    if (activeSummarizer === undefined) {
      throw new TypeError(
        '[graphorin/memory] ContextEngine.compactNow: no summarizer configured. ' +
          'Pass `summarizer` to createContextEngine({...}) or to compactNow({...}).',
      );
    }
    const compactionInputCall: ExecuteCompactionInput = {
      messages: callInput.messages,
      source: callInput.source,
      strategy:
        callInput.preserveRecentTurns !== undefined &&
        compactionStrategy.kind === 'summarize-old-preserve-recent'
          ? { ...compactionStrategy, preserveRecentTurns: callInput.preserveRecentTurns }
          : compactionStrategy,
      localePack,
      summarizer: activeSummarizer,
      tokenCounter,
      thresholdTokens: compactionThresholdTokens,
      runId: callInput.runId,
      sessionId: callInput.sessionId,
      agentId: callInput.agentId,
      scope: callInput.scope,
      providerTrust,
      now,
      ...(callInput.signal !== undefined ? { signal: callInput.signal } : {}),
    };
    // C4: one retry with a short backoff on summarizer failure, then a
    // strictly-smaller-than-input assert - a pass that dropped messages
    // yet did not shrink the buffer is a failure (a looping/echoing
    // summarizer), not a success to arm the anti-thrash guard with.
    let result: CompactionResult;
    try {
      result = await executeCompaction(compactionInputCall);
    } catch (firstError) {
      if (callInput.signal?.aborted === true) throw firstError;
      await new Promise<void>((resolve) => setTimeout(resolve, COMPACTION_RETRY_BACKOFF_MS));
      try {
        result = await executeCompaction(compactionInputCall);
      } catch (secondError) {
        recordCompactionFailure(
          secondError instanceof Error ? secondError.message : String(secondError),
        );
        throw secondError;
      }
    }
    if (result.droppedMessageIndices.length > 0 && result.afterTokens >= result.beforeTokens) {
      const reason = `compaction did not shrink the buffer (${result.beforeTokens} -> ${result.afterTokens} tokens)`;
      if (callInput.source === 'auto-trigger') {
        // The auto loop must never keep paying for passes that grow the
        // buffer (the Gemini-CLI compression-loop class) - fail the pass.
        recordCompactionFailure(reason);
        throw new Error(`[graphorin/memory] ${reason}`);
      }
      // An operator-requested compaction of a small window can
      // legitimately cost more than it reclaims (the summary skeleton
      // has a floor) - warn, hand back the result, count nothing.
      process.stderr.write(`[graphorin/memory] ${reason} (source: ${callInput.source}).\n`);
    } else if (result.droppedMessageIndices.length > 0) {
      // A pass that actually reclaimed space re-arms the auto trigger.
      consecutiveCompactionFailures = 0;
      if (autoCompactionDisabledByFailures) {
        autoCompactionDisabledByFailures = false;
        process.stderr.write(
          '[graphorin/memory] auto-compaction re-enabled after a successful pass.\n',
        );
      }
    }
    // C4: hand hooks the DROPPED message content (not just indices) so
    // re-anchoring hooks like reanchorRecentResults can recover the
    // result handles that just left the window. Reference-diff against
    // trimmedMessages (both strategies carry surviving originals by
    // reference; the per-strategy index spaces differ, so indices are
    // not usable here).
    const survivors = new Set(result.trimmedMessages);
    const droppedMessages = callInput.messages.filter((m) => !survivors.has(m));
    const ctx = {
      result,
      scope: callInput.scope,
      runId: callInput.runId,
      sessionId: callInput.sessionId,
      agentId: callInput.agentId,
      source: callInput.source,
      droppedMessages,
    };
    const hookFailures: Array<{ readonly hookName: string; readonly reason: string }> = [];
    const extraContent: MessageContent[] = [];
    let hooksFired = 0;
    // context-engine-02: the same D2 privacy decision `assemble()` applies
    // to blocks / rules / facts, handed to the hooks - their output is
    // spliced into the buffer and shipped to the provider, so it must obey
    // the same filter or secret-tier content leaks on the first compaction.
    const allowSensitivity = (sensitivity: Sensitivity | undefined): boolean =>
      privacyDecide(sensitivity, {
        ...(privacy.providerAcceptsSensitivity !== undefined
          ? { providerAcceptsSensitivity: privacy.providerAcceptsSensitivity }
          : {}),
        providerTrust,
        cloudUploadConsent,
        defaultSensitivity,
      }).decision === 'pass';
    for (const hook of compactionHooks) {
      try {
        // CE-6: hooks receive the REAL compaction context - the old code
        // built `ctx` and then `void ctx;`-discarded it while the
        // function-form wrapper fabricated a zeroed result.
        const parts = await hook.resolveContent(
          {
            memory: callInput.memory,
            scope: callInput.scope,
            ...(callInput.procedural !== undefined ? { procedural: callInput.procedural } : {}),
            allowSensitivity,
          },
          ctx,
        );
        extraContent.push(...parts);
        hooksFired += 1;
      } catch (err) {
        hookFailures.push({
          hookName: hook.id,
          reason: err instanceof Error ? err.name : 'UnknownError',
        });
      }
    }
    const enrichedResult: CompactionResult = Object.freeze({
      ...result,
      hooksFiredCount: hooksFired,
    });
    // CE-7: arm the anti-thrash guard and surface the failure mode where
    // compaction could not get under the trigger threshold.
    //
    // context-engine-04: `shouldCompact` compares the FULL buffer total
    // (pinned prefix included) against this baseline, so the baseline must
    // be full-basis too: body afterTokens + the caller's pinned prefix +
    // the Context-Essentials message the caller splices in. Arming with
    // the body-only number let any real system prompt (> 256 tokens)
    // defeat the guard, re-firing a summarizer LLM call at the top of
    // EVERY step whenever compaction could not get under the threshold.
    const prefixTokens =
      callInput.prefixMessages !== undefined && callInput.prefixMessages.length > 0
        ? await countMessageTokens(callInput.prefixMessages, tokenCounter)
        : 0;
    let essentialsTokens = 0;
    for (const part of extraContent) {
      if (part.type === 'text') essentialsTokens += await tokenCounter.countText(part.text);
    }
    const fullAfterTokens = enrichedResult.afterTokens + prefixTokens + essentialsTokens;
    lastCompactionAfterTokens = fullAfterTokens;
    if (
      compactionThresholdTokens !== Number.POSITIVE_INFINITY &&
      fullAfterTokens >= compactionThresholdTokens
    ) {
      process.stderr.write(
        `[graphorin/memory] compaction finished at ${fullAfterTokens} tokens (body ${enrichedResult.afterTokens} + pinned prefix ${prefixTokens} + essentials ${essentialsTokens}) - still at/above the ${compactionThresholdTokens}-token trigger (oversized preserved turns?). The immediate re-trigger is suppressed until the buffer grows.\n`,
      );
    }
    return Object.freeze({
      result: enrichedResult,
      extraContent: Object.freeze(extraContent),
      hookFailures: Object.freeze(hookFailures),
    });
  }

  return Object.freeze({
    assemble,
    shouldCompact,
    compactNow,
    config(): ResolvedContextEngineConfig {
      return resolvedConfig;
    },
  });
}

function buildCandidate(
  id: LayerCandidate['id'],
  text: string,
  cap: number | undefined,
): LayerCandidate {
  if (cap !== undefined) return { id, text, cap };
  return { id, text };
}

function annotationForLayer(layer: LayerAllocation): ContentAnnotation {
  switch (layer.id) {
    case 'identity':
      // Identity merges the framework base (Layer 1) + the user-defined
      // agent_instructions (Layer 2) into one trusted fragment, tagged
      // `system:framework` so D3 skips re-scanning it under
      // `scanScope: 'untrusted'`. (Both halves are first-party prompt text, so
      // the merged layer carries a single framework trust tag - `LayerAllocation`
      // does not surface which halves were present.)
      return annotate('system:framework', 'n/a');
    case 'memoryMetadata':
    case 'activeRules':
    case 'workingBlocks':
    case 'activeSkills':
    case 'autoRecall':
      return annotate('memory:tier-filtered', 'n/a');
    default:
      return annotate('system:framework', 'n/a');
  }
}

function renderWorkingBlocks(
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
      block.description !== undefined ? ` description="${escapeXmlAttr(block.description)}"` : '';
    lines.push(`  <block label="${escapeXmlAttr(block.label)}"${description}>`);
    lines.push(`    ${escapeXmlText(block.value)}`);
    lines.push('  </block>');
  }
  lines.push('</memory_blocks>');
  return lines.join('\n');
}

function renderProceduralRules(
  rules: ReadonlyArray<{ readonly text: string; readonly priority: number }>,
): string {
  if (rules.length === 0) return '';
  const lines = ['<memory_rules>'];
  for (const rule of rules) {
    lines.push(`  <rule priority="${rule.priority}">${escapeXmlText(rule.text)}</rule>`);
  }
  lines.push('</memory_rules>');
  return lines.join('\n');
}

function renderAutoRecalledFacts(facts: ReadonlyArray<Fact>): string {
  if (facts.length === 0) return '';
  const lines = ['<auto_recalled_facts>'];
  for (const fact of facts) {
    const tagsAttr =
      fact.tags !== undefined ? ` tags="${escapeXmlAttr((fact.tags ?? []).join(','))}"` : '';
    lines.push(
      `  <fact id="${escapeXmlAttr(fact.id)}"${tagsAttr}>${escapeXmlText(fact.text)}</fact>`,
    );
  }
  lines.push('</auto_recalled_facts>');
  return lines.join('\n');
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function resolvePackInput(input: ContextEngineConfig['locale']): ContextLocalePack {
  if (input === undefined) return enLocalePack;
  if (typeof input === 'string') {
    if (input === enLocalePack.id) return enLocalePack;
    return resolveLocalePack({ id: input });
  }
  return resolveLocalePack(input);
}

function resolveDefaultHooks(
  input: ReadonlyArray<PostCompactionHook> | ReadonlyArray<NamedPostCompactionHook> | undefined,
): ReadonlyArray<NamedPostCompactionHook> {
  if (input === undefined) {
    return Object.freeze([
      reanchorProjectRules(),
      reanchorPersonaBlock(),
      reanchorPinnedFacts({ pinnedFactIds: [] }),
    ]);
  }
  return Object.freeze(
    input.map((hook, idx): NamedPostCompactionHook => {
      if (typeof hook === 'function') {
        const id = `customHook_${idx}`;
        return {
          id,
          async resolveContent(_deps, ctx) {
            // CE-6: the operator's hook sees the genuine compaction
            // context. `ctx` is always supplied by compactNow; the
            // throw guards a direct caller that forgot it rather than
            // silently fabricating zeros (the old behaviour).
            if (ctx === undefined) {
              throw new TypeError(
                '[graphorin/memory] post-compaction hooks require the compaction context - call through ContextEngine.compactNow(...).',
              );
            }
            const result = await hook(ctx);
            return result;
          },
        };
      }
      return hook;
    }),
  );
}

/**
 * Augment a {@link MemoryMetadata} snapshot with the active locale +
 * embedder tags so the rendered metadata block carries the
 * additional context the model uses for reasoning. Pure: the
 * original `meta` reference is not mutated.
 */
function enrichMetadataTags(
  meta: import('@graphorin/core').MemoryMetadata,
  localeId: string,
  embedderId: string | null,
): import('@graphorin/core').MemoryMetadata {
  const baseTags = meta.tags !== undefined ? [...meta.tags] : [];
  if (!baseTags.some((tag) => tag.startsWith('locale:'))) {
    baseTags.push(`locale:${localeId}`);
  }
  if (embedderId !== null && !baseTags.some((tag) => tag.startsWith('embedder:'))) {
    baseTags.push(`embedder:${embedderId}`);
  }
  return { ...meta, tags: Object.freeze(baseTags) };
}
