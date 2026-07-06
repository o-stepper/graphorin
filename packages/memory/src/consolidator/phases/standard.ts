/**
 * Standard phase - extracts new facts from session messages via the
 * configured cheap-tier provider. The phase is gated by the active
 * tier (DEC-144 / ADR-038) and the budget tracker; it never runs
 * under `tier: 'free'`.
 *
 * The extraction prompt asks the model to return a JSON array of
 * `{ text, subject?, predicate?, object?, confidence? }` objects;
 * malformed responses are tolerated (counted as `emptyExtractions`)
 * so a flaky cheap model never wedges the pipeline.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest, SessionScope, Tracer } from '@graphorin/core';
import {
  type ConflictDecision,
  type ReconcileDecision,
  reconcileToConflictDecision,
} from '../../conflict/index.js';
import {
  type ContextualRetrievalMode,
  contextualizeWithLlm,
} from '../../internal/contextualize.js';
import { newMemoryId } from '../../internal/id.js';
import { sliceJsonObject, stripFence } from '../../internal/llm-json.js';
import { withMemorySpan } from '../../internal/spans.js';
import type {
  ConsolidatorMemoryStoreExt,
  MemoryStoreAdapter,
  SessionMessageRecord,
} from '../../internal/storage-adapter.js';
import type { EpisodicMemory } from '../../tiers/episodic-memory.js';
import type { FactInput, SemanticMemory } from '../../tiers/semantic-memory.js';
import type { BudgetTracker } from '../budget.js';
import { applyNoiseFilters, type NoiseFilterPreset, renderText } from '../noise-filter.js';
import { preFilterCandidate, reconcileCandidate } from '../reconcile.js';
import type { PhaseOutcome } from '../types.js';

/** Top-s nearest neighbours surfaced to the reconcile pre-filter + LLM. */
const RECONCILE_TOP_K = 10;

/** Inputs accepted by {@link runStandardPhase}. */
export interface StandardPhaseDeps {
  readonly semantic: SemanticMemory;
  /**
   * Episodic tier used for auto-episode-formation (P1-2). Omitted /
   * `null` ⇒ episode formation is skipped regardless of `formEpisodes`.
   */
  readonly episodic?: EpisodicMemory | null;
  /** Auto-form a quarantined episode per processed slice (P1-2). */
  readonly formEpisodes: boolean;
  /** Ask the episode summary call for a `[1, 10]` importance score (P1-2). */
  readonly importanceScoring: boolean;
  /**
   * Auto-promotion policy (MCON-2). When `true`, an injection-clean extraction
   * fact is admitted `active` instead of quarantined. Injection-flagged facts
   * always stay quarantined. Off by default.
   */
  readonly autoPromoteExtraction: boolean;
  /**
   * Contextual-retrieval mode for additive fact writes (P1-3). `'llm'`
   * spends one budgeted cheap-model call per `add` to author a situating
   * prefix; `'late-chunk'` / `'off'` defer to the shared
   * {@link SemanticMemory} instance (no extra call here).
   */
  readonly contextualRetrieval: ContextualRetrievalMode;
  readonly store: MemoryStoreAdapter;
  readonly consolidatorStore: ConsolidatorMemoryStoreExt | null;
  readonly provider: Provider;
  readonly tracer: Tracer;
  readonly scope: SessionScope;
  readonly cheapModel: string | null;
  readonly noiseFilters: ReadonlyArray<NoiseFilterPreset>;
  readonly maxBatchSize: number;
  /**
   * W-081: input transcript budget in characters (chars/4 token proxy).
   * A multi-message slice whose rendered transcript exceeds it is
   * half-split BEFORE the provider call; a single message that alone
   * exceeds it is tail-truncated (recorded on the phase span).
   */
  readonly maxTranscriptChars: number;
  readonly lastProcessedMessageId: string | null;
  readonly budget: BudgetTracker;
  /** Computes USD cost for the recorded usage. Defaults to 0 when omitted. */
  readonly priceUsage?: (usage: { promptTokens: number; completionTokens: number }) => number;
  readonly tier: 'cheap' | 'standard' | 'full' | 'custom';
  /** Override the wall clock - used by tests + the runtime clock seam. */
  readonly now?: () => number;
  /**
   * Pre-fetched message batch - when supplied, the phase skips its
   * own `listMessagesSince(...)` call and operates on the supplied
   * rows. The runtime always pre-fetches the batch so the cursor
   * advance can use the same data the phase processed.
   */
  readonly batch?: ReadonlyArray<SessionMessageRecord>;
}

interface ExtractedFact {
  readonly text: string;
  readonly subject?: string;
  readonly predicate?: string;
  readonly object?: string;
  readonly confidence?: number;
  /** Raw `[1, 10]` importance as returned by the model, pre-normalization (MCON-12). */
  readonly importance?: number;
}

/** Parsed episode-summary payload (P1-2). */
interface ExtractedEpisode {
  readonly summary: string;
  /** Raw `[1, 10]` importance as returned by the model, pre-normalization. */
  readonly importance?: number;
}

const EXTRACTION_SYSTEM_PROMPT = [
  'You are a memory-extraction assistant for a long-running personal-assistant runtime.',
  'Read the supplied conversation slice and return the durable facts it asserts about the user, the world, or stable preferences.',
  'Skip greetings, banter, transient state, and anything the assistant produced as boilerplate.',
  // C5 (memory-consolidation-08): decontextualization - proposition-
  // granular retrieval only works when each stored fact stands alone.
  'Each fact text MUST be a self-contained proposition understandable with no surrounding context: resolve pronouns and ellipses to the named person or thing ("she" -> "Maria"), inline the concrete entities, and never write a fact that needs a neighbouring fact to make sense.',
  'For each fact also rate how important it is for remembering the user, on an integer scale from 1 (incidental detail) to 10 (identity-defining).',
  'Return a single JSON object: { "facts": [{ "text": string, "subject"?: string, "predicate"?: string, "object"?: string, "confidence"?: number, "importance"?: number }] }.',
  'If the slice contains no durable facts, return { "facts": [] }.',
].join(' ');

/**
 * Per-call output-token ceilings (MCON-14). `BudgetTracker.record()`
 * only runs AFTER `provider.generate` returns, so without a request cap
 * a degenerate model response could blow through the daily ceiling in a
 * single call before `pause` can take effect. All consolidator output
 * shapes are small and well-defined; the caps are deliberately roomy.
 */
const EXTRACTION_MAX_TOKENS = 1024;
const EPISODE_MAX_TOKENS = 512;

const EPISODE_SUMMARY_SYSTEM_PROMPT = [
  'You are an episode-summarization assistant for a long-running personal-assistant runtime.',
  'Read the supplied conversation slice and write one concise third-person summary of what happened - the episode.',
  'Return a single JSON object: { "summary": string }.',
].join(' ');

const EPISODE_SUMMARY_IMPORTANCE_SYSTEM_PROMPT = [
  'You are an episode-summarization assistant for a long-running personal-assistant runtime.',
  'Read the supplied conversation slice and write one concise third-person summary of what happened - the episode.',
  'Also rate how important / poignant this episode is for remembering the user, on an integer scale from 1 (mundane) to 10 (deeply significant).',
  'Return a single JSON object: { "summary": string, "importance": number }.',
].join(' ');

/**
 * Run the standard phase. Returns a {@link PhaseOutcome}; errors are
 * surfaced via `status: 'failed'` + `errorMessage` so the caller can
 * land the batch in the DLQ.
 *
 * @stable
 */
export async function runStandardPhase(deps: StandardPhaseDeps): Promise<PhaseOutcome> {
  return withMemorySpan(
    deps.tracer,
    'memory.consolidate.standard',
    deps.scope,
    {
      'consolidator.phase': 'standard',
      'consolidator.tier': deps.tier,
      'consolidator.cheap_model': deps.cheapModel ?? deps.provider.modelId,
    },
    async (span) => {
      const startedAt = (typeof deps.now === 'function' ? deps.now : Date.now)();
      const session = deps.store.session;
      let rawBatch: ReadonlyArray<SessionMessageRecord>;
      if (deps.batch !== undefined) {
        rawBatch = deps.batch;
      } else {
        if (typeof session.listMessagesSince !== 'function') {
          span.setAttributes({
            'consolidator.standard.skipped': 'no-cursor-support',
            'consolidator.duration_ms': 0,
            'consolidator.facts_extracted': 0,
            'consolidator.budget_used_usd': 0,
          });
          return emptyOutcome('completed');
        }
        rawBatch = await session.listMessagesSince(
          deps.scope,
          deps.lastProcessedMessageId,
          deps.maxBatchSize,
        );
      }
      const filtered = applyNoiseFilters(
        rawBatch as ReadonlyArray<SessionMessageRecord>,
        deps.noiseFilters,
      );
      span.setAttributes({
        'consolidator.standard.batch_size': rawBatch.length,
        'consolidator.standard.kept_count': filtered.kept.length,
        'consolidator.standard.noise_filtered': filtered.droppedCount,
      });
      if (filtered.kept.length === 0) {
        span.setAttributes({
          'consolidator.duration_ms': Math.max(
            0,
            (typeof deps.now === 'function' ? deps.now : Date.now)() - startedAt,
          ),
          'consolidator.facts_extracted': 0,
          'consolidator.budget_used_usd': 0,
        });
        return {
          ...emptyOutcome('completed'),
          noiseFilteredCount: filtered.droppedCount,
        };
      }

      const transcript = renderTranscript(filtered.kept);
      // W-020: the extraction handles `finishReason: 'length'` by
      // half-splitting the batch (or salvaging the complete prefix of a
      // single-message slice) instead of letting a truncated JSON parse
      // to `[]` and the runtime advance the cursor over a lossy slice.
      // Budget recording happens per generate call inside the helper.
      const extraction = await extractFactsFromSlice(deps, filtered.kept);
      const facts = extraction.facts;
      const cost = extraction.costUsd;
      let factsCreated = 0;
      let factsUpdated = 0;
      let conflictsResolved = 0;
      let reconcileTokens = 0;
      let reconcileCost = 0;
      let contextualTokens = 0;
      let contextualCost = 0;
      const extractionTokens = extraction.tokens;

      for (const fact of facts) {
        if (fact.text.trim().length === 0) continue;
        const input = buildFactInput(fact);

        // Neighbour-aware reconciliation (P0-3). A cheap, LLM-free pre-filter
        // (Stage 1 exact-dedup + Stage 2 embedding zones) classifies the
        // candidate against its nearest neighbours; only the ambiguous
        // CONFLICT-CHECK mid-zone spends a reconcile LLM call. With no
        // embedder configured `neighbors` is empty → every candidate is a
        // fresh `add`, preserving the pre-reconcile behaviour.
        const neighbors = await deps.semantic.neighbors(deps.scope, fact.text, {
          topK: RECONCILE_TOP_K,
        });
        let route = await preFilterCandidate(fact.text, neighbors);
        // memory-consolidation-07: without an embedder `neighbors` is
        // always empty, so dedup never fires and a DLQ replay (or plain
        // re-run) of a partially-committed slice re-writes every
        // already-committed fact verbatim. Guard with an
        // embedder-independent exact-text lookup: FTS top hits +
        // string equality. Skipped in the mainline (embedder) config,
        // where the KNN stages already catch exact duplicates.
        if (route.route !== 'noop' && neighbors.length === 0) {
          const exactId = await findExactTextDuplicate(deps.semantic, deps.scope, fact.text);
          if (exactId !== null) {
            route = { route: 'noop', targetId: exactId, reason: 'exact-text-fts' };
          }
        }

        let decision: ReconcileDecision;
        let audited: ConflictDecision;
        if (route.route === 'reconcile' && !deps.budget.snapshot().paused) {
          const result = await reconcileCandidate({
            candidateText: fact.text,
            neighbors: neighbors.map((h) => ({
              id: h.record.id,
              text: h.record.text,
              ...(h.record.validFrom !== undefined ? { validFrom: h.record.validFrom } : {}),
            })),
            provider: deps.provider,
            scope: deps.scope,
          });
          decision = result.decision;
          audited = reconcileToConflictDecision(decision);
          reconcileTokens += result.usage.totalTokens;
          const callCost =
            deps.priceUsage?.({
              promptTokens: result.usage.promptTokens,
              completionTokens: result.usage.completionTokens,
            }) ?? 0;
          reconcileCost += callCost;
          deps.budget.record({
            phase: 'standard',
            tokens: result.usage.totalTokens,
            costUsd: callCost,
          });
        } else if (route.route === 'reconcile') {
          // Mid-zone but the budget is exhausted - fall back to a safe
          // additive write rather than spending an over-budget LLM call.
          decision = { action: 'add', reason: 'reconcile-budget-paused' };
          audited = { kind: 'admit', stage: 'defer-to-deep', reason: 'reconcile-budget-paused' };
        } else if (route.route === 'noop') {
          decision = { action: 'noop', targetId: route.targetId, reason: route.reason };
          audited = {
            kind: 'dedup',
            stage:
              route.reason === 'exact-hash-match' || route.reason === 'exact-text-fts'
                ? 'exact-dedup'
                : 'embedding-three-zone',
            existingId: route.targetId,
            ...(route.similarity !== undefined ? { similarity: route.similarity } : {}),
            reason: route.reason,
          };
        } else {
          decision = { action: 'add', reason: route.reason };
          audited = { kind: 'admit', stage: 'embedding-three-zone', reason: route.reason };
        }

        // Apply the decision. Updates / conflicts route through the
        // bi-temporal supersede (close the old interval, insert the new) -
        // never a destructive delete (P0-3).
        let candidateId: string;
        switch (decision.action) {
          case 'add': {
            // Contextual retrieval (P1-3). In `'llm'` mode (and only when
            // the budget is not exhausted) spend one cheap-model call to
            // author a situating prefix and pass it as the write's index
            // text; the helper degrades to the deterministic late-chunk
            // prefix on any failure. `'late-chunk'` / `'off'` add nothing
            // here - the shared SemanticMemory instance contextualizes the
            // write. This LLM call is the only contextualization that
            // touches a provider, keeping `'llm'` strictly consolidator-only.
            let indexText: string | undefined;
            if (deps.contextualRetrieval === 'llm' && !deps.budget.snapshot().paused) {
              const ctx = await contextualizeWithLlm(
                {
                  text: input.text,
                  ...(input.subject !== undefined ? { subject: input.subject } : {}),
                  ...(input.predicate !== undefined ? { predicate: input.predicate } : {}),
                  ...(input.object !== undefined ? { object: input.object } : {}),
                },
                deps.provider,
              );
              indexText = ctx.indexText;
              const ctxTokens =
                (ctx.usage.promptTokens ?? 0) +
                (ctx.usage.completionTokens ?? 0) +
                (ctx.usage.reasoningTokens ?? 0);
              const ctxCost =
                deps.priceUsage?.({
                  promptTokens: ctx.usage.promptTokens,
                  completionTokens: ctx.usage.completionTokens,
                }) ?? 0;
              contextualTokens += ctxTokens;
              contextualCost += ctxCost;
              deps.budget.record({ phase: 'standard', tokens: ctxTokens, costUsd: ctxCost });
            }
            // `pipeline: 'off'` - the standard phase has already made the
            // conflict decision; a second inline pass would re-search +
            // double-audit.
            const stored = await deps.semantic.remember(deps.scope, input, {
              pipeline: 'off',
              ...(indexText !== undefined ? { indexText } : {}),
              ...(deps.autoPromoteExtraction ? { autoPromoteSynthesized: true } : {}),
            });
            candidateId = stored.id;
            factsCreated += 1;
            break;
          }
          case 'noop': {
            // Duplicate of `targetId` - record the dedup, write nothing.
            candidateId = newMemoryId('fact');
            break;
          }
          case 'update': {
            // W-019: the escape hatch applies to update/conflict routes
            // exactly like the 'add' route (the documented contract of
            // autoPromoteExtraction); without it the successor stays
            // quarantined and the supersede is PENDING - the old fact
            // remains recall-visible until fact_validate promotes the
            // successor.
            const { new: stored } = await deps.semantic.supersede(
              deps.scope,
              decision.targetId,
              input,
              decision.reason,
              { autoPromoteSynthesized: deps.autoPromoteExtraction },
            );
            candidateId = stored.id;
            factsUpdated += 1;
            break;
          }
          case 'conflict': {
            const { new: stored } = await deps.semantic.supersede(
              deps.scope,
              decision.targetId,
              input,
              decision.reason,
              { autoPromoteSynthesized: deps.autoPromoteExtraction },
            );
            candidateId = stored.id;
            factsUpdated += 1;
            conflictsResolved += 1;
            break;
          }
        }

        // Every decision is auditable in `fact_conflicts` (best-effort -
        // a store without the conflict surface simply skips it).
        await recordConflictDecision(deps.store, deps.scope, candidateId, audited);
      }

      // Episode formation (P1-2). Summarize the processed slice into one
      // quarantined episode carrying an LLM importance score, so the
      // episodic triple-signal ranking (recency × relevance × importance)
      // runs on all three signals. Budget-gated + provenance-tagged
      // (P1-4): skipped when `formEpisodes` is off, no episodic tier is
      // wired, or the budget is exhausted - the slice still advanced the
      // cursor, so the phase degrades to fact-only behaviour.
      let episodesFormed = 0;
      let episodeTokens = 0;
      let episodeCost = 0;
      if (
        deps.formEpisodes &&
        deps.episodic != null &&
        filtered.kept.length > 0 &&
        !deps.budget.snapshot().paused
      ) {
        const episodeRes = await deps.provider.generate(
          buildEpisodeRequest(deps, transcript, deps.importanceScoring),
        );
        const epUsage = episodeRes.usage;
        episodeTokens =
          (epUsage.promptTokens ?? 0) +
          (epUsage.completionTokens ?? 0) +
          (epUsage.reasoningTokens ?? 0);
        episodeCost =
          deps.priceUsage?.({
            promptTokens: epUsage.promptTokens,
            completionTokens: epUsage.completionTokens,
          }) ?? 0;
        deps.budget.record({ phase: 'standard', tokens: episodeTokens, costUsd: episodeCost });

        const parsed = parseEpisode(episodeRes.text);
        if (parsed !== null && parsed.summary.trim().length > 0) {
          const importance = deps.importanceScoring
            ? normalizeImportance(parsed.importance)
            : undefined;
          const nowFallback = new Date(
            (typeof deps.now === 'function' ? deps.now : Date.now)(),
          ).toISOString();
          const startedAt = filtered.kept[0]?.createdAt ?? nowFallback;
          const endedAt = filtered.kept[filtered.kept.length - 1]?.createdAt ?? startedAt;
          await deps.episodic.record(deps.scope, {
            summary: parsed.summary,
            startedAt,
            endedAt,
            ...(importance !== undefined ? { importance } : {}),
            provenance: 'extraction',
            status: 'quarantined',
            // D3: an auto-formed episode is the agent's own synthesis.
            owner: 'agent',
          });
          episodesFormed = 1;
        }
      }

      const totalTokens = extractionTokens + reconcileTokens + episodeTokens + contextualTokens;
      const totalCost = cost + reconcileCost + episodeCost + contextualCost;
      const snapshot = deps.budget.snapshot();

      span.setAttributes({
        'consolidator.duration_ms': Math.max(
          0,
          (typeof deps.now === 'function' ? deps.now : Date.now)() - startedAt,
        ),
        'consolidator.facts_extracted': factsCreated,
        'consolidator.budget_used_usd': totalCost,
        'consolidator.standard.facts_extracted': factsCreated,
        'consolidator.standard.facts_updated': factsUpdated,
        'consolidator.standard.conflicts_resolved': conflictsResolved,
        'consolidator.standard.episodes_formed': episodesFormed,
        'consolidator.standard.reconcile_tokens': reconcileTokens,
        'consolidator.standard.episode_tokens': episodeTokens,
        'consolidator.standard.contextual_tokens': contextualTokens,
        // W-020: 'empty slice' vs 'truncated output' must be
        // distinguishable - these attrs stay 0 on the ordinary path.
        'consolidator.standard.extraction_calls': extraction.generateCalls,
        'consolidator.standard.length_splits': extraction.lengthSplits,
        'consolidator.standard.truncated_salvage': extraction.truncatedSalvages,
        // W-081: input-budget splits / single-message tail truncations.
        'consolidator.standard.budget_splits': extraction.budgetSplits,
        'consolidator.standard.input_truncations': extraction.inputTruncations,
        'consolidator.standard.tokens.input': extraction.promptTokens,
        'consolidator.standard.tokens.output': extraction.completionTokens,
        'consolidator.standard.cost.estimate.usd': totalCost,
        'consolidator.budget.remaining.tokens': snapshot.tokensRemaining,
        'consolidator.budget.remaining.usd': snapshot.costRemaining,
        'consolidator.exceeded': snapshot.paused,
      });

      return {
        phase: 'standard',
        status: 'completed',
        factsCreated,
        factsUpdated,
        conflictsResolved,
        episodesFormed,
        insightsCreated: 0,
        noiseFilteredCount: filtered.droppedCount,
        emptyExtractions: facts.length === 0 ? 1 : 0,
        llmTokensUsed: totalTokens,
        llmCostUsd: totalCost,
        errorMessage: null,
      };
    },
  );
}

/** Aggregated result of {@link extractFactsFromSlice}. */
interface SliceExtraction {
  readonly facts: ReadonlyArray<ExtractedFact>;
  /** Total extraction tokens across every generate call. */
  readonly tokens: number;
  readonly costUsd: number;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly generateCalls: number;
  /** Number of batches that were half-split on `finishReason: 'length'`. */
  readonly lengthSplits: number;
  /** Number of single-message slices salvaged from a truncated output. */
  readonly truncatedSalvages: number;
  /** W-081: number of batches half-split on the INPUT transcript budget. */
  readonly budgetSplits: number;
  /** W-081: number of lone over-budget messages that were tail-truncated. */
  readonly inputTruncations: number;
}

/**
 * W-020: run 'render transcript -> generate -> record budget -> parse'
 * for one slice, handling `finishReason: 'length'`:
 *
 * - multi-message slice: split in half (message order preserved) and
 *   recurse - depth is bounded by log2(maxStandardBatchSize) and each
 *   call passes `deps.budget.record`, with a pause check before every
 *   sub-call (a paused budget THROWS, so the runtime lands the batch in
 *   the DLQ WITHOUT advancing the cursor - the established failure
 *   semantics). A DLQ route on truncation itself was rejected: replay
 *   re-reads the same slice with the same output cap and deterministically
 *   truncates again (the W-081 wedge shape); half-splitting converges.
 * - single message: salvage the complete prefix of the truncated JSON
 *   ({@link salvageTruncatedExtraction}) - a lone message that overflows
 *   the cap cannot be split further, and losing its parseable facts is
 *   strictly worse than keeping them.
 *
 * Facts are only RETURNED here; the caller writes them after every
 * sub-slice extracted successfully, so a mid-split failure leaves no
 * partially-committed slice (replay is additionally guarded by the
 * exact-text dedup, memory-consolidation-07).
 */
async function extractFactsFromSlice(
  deps: StandardPhaseDeps,
  messages: ReadonlyArray<SessionMessageRecord>,
): Promise<SliceExtraction> {
  // W-081: input-side transcript budget. `maxStandardBatchSize` bounds
  // only the MESSAGE COUNT; a batch of near-noise-cap messages can render
  // to hundreds of kilobytes and overflow a cheap-tier context on EVERY
  // retry - the permanent cursor wedge W-081 describes. Split BEFORE
  // spending a provider call that would deterministically fail.
  if (messages.length > 1 && renderTranscript(messages).length > deps.maxTranscriptChars) {
    return extractHalves(deps, messages, {
      tokens: 0,
      costUsd: 0,
      promptTokens: 0,
      completionTokens: 0,
      generateCalls: 0,
      lengthSplits: 0,
      truncatedSalvages: 0,
      budgetSplits: 1,
      inputTruncations: 0,
    });
  }

  // W-081: a lone message that alone exceeds the budget cannot be split
  // further - truncate its tail (the phase span records the count) so
  // extraction keeps whatever facts the head carries instead of failing
  // on the same oversized message forever.
  let effective = messages;
  let inputTruncations = 0;
  const sole = messages.length === 1 ? messages[0] : undefined;
  if (sole !== undefined) {
    const rendered = renderTranscript(messages);
    if (rendered.length > deps.maxTranscriptChars) {
      const overshoot = rendered.length - deps.maxTranscriptChars;
      const text = renderText(sole.message);
      const keep = Math.max(0, text.length - overshoot);
      effective = [{ ...sole, message: { ...sole.message, content: text.slice(0, keep) } }];
      inputTruncations = 1;
    }
  }

  const request = buildRequest(deps, renderTranscript(effective));
  const response = await deps.provider.generate(request);
  const usage = response.usage;
  const costUsd =
    deps.priceUsage?.({
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    }) ?? 0;
  const tokens =
    (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0) + (usage.reasoningTokens ?? 0);
  deps.budget.record({ phase: 'standard', tokens, costUsd });
  const base = {
    tokens,
    costUsd,
    promptTokens: usage.promptTokens ?? 0,
    completionTokens: usage.completionTokens ?? 0,
    generateCalls: 1,
    budgetSplits: 0,
    inputTruncations,
  };

  if (response.finishReason !== 'length') {
    return {
      ...base,
      facts: parseExtraction(response.text),
      lengthSplits: 0,
      truncatedSalvages: 0,
    };
  }

  if (messages.length === 1) {
    return {
      ...base,
      facts: salvageTruncatedExtraction(response.text),
      lengthSplits: 0,
      truncatedSalvages: 1,
    };
  }

  return extractHalves(deps, messages, { ...base, lengthSplits: 1, truncatedSalvages: 0 });
}

/**
 * Split `messages` in half (order preserved) and extract each half
 * recursively, folding counters into `seed`. Shared by the two split
 * triggers: output truncation (W-020, `finishReason: 'length'`) and the
 * W-081 input budget (transcript over `maxTranscriptChars`). Depth is
 * bounded by log2(maxStandardBatchSize); a paused budget THROWS so the
 * runtime lands the batch in the DLQ WITHOUT advancing the cursor (the
 * established failure semantics - see the {@link extractFactsFromSlice}
 * docblock for why a DLQ route on truncation itself was rejected).
 */
async function extractHalves(
  deps: StandardPhaseDeps,
  messages: ReadonlyArray<SessionMessageRecord>,
  seed: Omit<SliceExtraction, 'facts'>,
): Promise<SliceExtraction> {
  const mid = Math.ceil(messages.length / 2);
  const halves = [messages.slice(0, mid), messages.slice(mid)];
  const merged: ExtractedFact[] = [];
  let acc = seed;
  for (const half of halves) {
    if (deps.budget.snapshot().paused) {
      throw new Error(
        'standard extraction needs a sub-slice split and the budget is paused - aborting ' +
          'the split so the batch lands in the DLQ without advancing the cursor',
      );
    }
    const sub = await extractFactsFromSlice(deps, half);
    merged.push(...sub.facts);
    acc = {
      tokens: acc.tokens + sub.tokens,
      costUsd: acc.costUsd + sub.costUsd,
      promptTokens: acc.promptTokens + sub.promptTokens,
      completionTokens: acc.completionTokens + sub.completionTokens,
      generateCalls: acc.generateCalls + sub.generateCalls,
      lengthSplits: acc.lengthSplits + sub.lengthSplits,
      truncatedSalvages: acc.truncatedSalvages + sub.truncatedSalvages,
      budgetSplits: acc.budgetSplits + sub.budgetSplits,
      inputTruncations: acc.inputTruncations + sub.inputTruncations,
    };
  }
  return { ...acc, facts: merged };
}

/**
 * W-020: recover the complete prefix of a length-truncated extraction.
 * Walks the `facts` array with string/escape-aware bracket tracking,
 * cuts the trailing incomplete object, closes the array, and delegates
 * field validation to {@link parseExtraction}. A salvaged half-formed
 * fact is acceptable: everything returned here still flows through the
 * ordinary reconcile / quarantine path. Returns `[]` when nothing
 * complete survived.
 *
 * @internal
 */
export function salvageTruncatedExtraction(text: string | undefined): ReadonlyArray<ExtractedFact> {
  if (text === undefined || text.length === 0) return [];
  const candidate = stripFence(text);
  const arrayStart = candidate.indexOf('[');
  if (arrayStart < 0) return [];
  let inString = false;
  let escaped = false;
  let depth = 0;
  let lastCompleteEnd = -1;
  let closedProperly = false;
  for (let i = arrayStart + 1; i < candidate.length; i += 1) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') {
      depth += 1;
      continue;
    }
    if (ch === '}' || ch === ']') {
      if (ch === ']' && depth === 0) {
        // The array itself closed - the truncation happened later.
        lastCompleteEnd = i;
        closedProperly = true;
        break;
      }
      depth -= 1;
      if (depth === 0) lastCompleteEnd = i;
    }
  }
  if (lastCompleteEnd < 0) return [];
  const arrayText = candidate.slice(arrayStart, lastCompleteEnd + 1);
  const repaired = `{"facts":${arrayText}${closedProperly ? '' : ']'}}`;
  try {
    JSON.parse(repaired);
  } catch {
    return [];
  }
  return parseExtraction(repaired);
}

function buildRequest(deps: StandardPhaseDeps, transcript: string): ProviderRequest {
  // memory-consolidation-08: temporal anchoring - state today's date and
  // instruct the model to resolve relative time into absolute dates, so
  // "I'm interviewing next Friday" becomes a dated, durable fact.
  const today = new Date(deps.now?.() ?? Date.now()).toISOString().slice(0, 10);
  return {
    messages: [
      {
        role: 'user',
        content: `Conversation slice:\n${transcript}`,
      },
    ],
    systemMessage:
      `${EXTRACTION_SYSTEM_PROMPT} Today is ${today}. Each transcript line carries its ` +
      'timestamp in parentheses; resolve relative dates ("next Friday", "last month") ' +
      'into absolute ISO dates in the extracted fact text.',
    temperature: 0,
    maxTokens: EXTRACTION_MAX_TOKENS,
    metadata: {
      userId: deps.scope.userId,
      ...(deps.scope.sessionId !== undefined ? { sessionId: deps.scope.sessionId } : {}),
      ...(deps.scope.agentId !== undefined ? { agentId: deps.scope.agentId } : {}),
    },
    outputType: { kind: 'structured' },
  };
}

/**
 * Build the episode-summarization request (P1-2). Uses the same
 * transcript + structured-output seam as {@link buildRequest}; the
 * system prompt switches on `withImportance` so a poignancy score is
 * only requested when importance scoring is enabled.
 */
function buildEpisodeRequest(
  deps: StandardPhaseDeps,
  transcript: string,
  withImportance: boolean,
): ProviderRequest {
  return {
    messages: [
      {
        role: 'user',
        content: `Conversation slice:\n${transcript}`,
      },
    ],
    systemMessage: withImportance
      ? EPISODE_SUMMARY_IMPORTANCE_SYSTEM_PROMPT
      : EPISODE_SUMMARY_SYSTEM_PROMPT,
    temperature: 0,
    maxTokens: EPISODE_MAX_TOKENS,
    metadata: {
      userId: deps.scope.userId,
      ...(deps.scope.sessionId !== undefined ? { sessionId: deps.scope.sessionId } : {}),
      ...(deps.scope.agentId !== undefined ? { agentId: deps.scope.agentId } : {}),
    },
    outputType: { kind: 'structured' },
  };
}

function renderTranscript(messages: ReadonlyArray<SessionMessageRecord>): string {
  return messages
    .map((m) => {
      const role = m.message.role;
      const text = renderText(m.message);
      // memory-consolidation-08: per-message timestamps anchor the
      // extraction - without them relative time ("next Friday", "last
      // month") distils into facts with no resolvable timeframe.
      const stamp = typeof m.createdAt === 'string' && m.createdAt.length > 0 ? m.createdAt : '';
      return stamp.length > 0
        ? `[${m.sequence}] (${stamp}) ${role}: ${text}`
        : `[${m.sequence}] ${role}: ${text}`;
    })
    .join('\n');
}

/**
 * Parse the model output into the structured fact list. Tolerates
 * fenced blocks + trailing commentary so a chatty model does not
 * wedge the cursor.
 *
 * @internal
 */
export function parseExtraction(text: string | undefined): ReadonlyArray<ExtractedFact> {
  if (text === undefined || text.length === 0) return [];
  const candidate = stripFence(text).trim();
  if (candidate.length === 0) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    const slice = sliceJsonObject(candidate);
    if (slice === null) return [];
    try {
      parsed = JSON.parse(slice);
    } catch {
      return [];
    }
  }
  if (parsed === null || typeof parsed !== 'object') return [];
  const root = parsed as { facts?: unknown };
  const facts = Array.isArray(root.facts) ? root.facts : Array.isArray(parsed) ? parsed : [];
  const out: ExtractedFact[] = [];
  for (const item of facts) {
    if (item === null || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const text = typeof obj.text === 'string' ? obj.text : null;
    if (text === null || text.trim().length === 0) continue;
    const fact: ExtractedFact = {
      text,
      ...(typeof obj.subject === 'string' ? { subject: obj.subject } : {}),
      ...(typeof obj.predicate === 'string' ? { predicate: obj.predicate } : {}),
      ...(typeof obj.object === 'string' ? { object: obj.object } : {}),
      ...(typeof obj.confidence === 'number' ? { confidence: obj.confidence } : {}),
      ...(typeof obj.importance === 'number' ? { importance: obj.importance } : {}),
    };
    out.push(fact);
  }
  return out;
}

/**
 * Parse the episode-summary model output into `{ summary, importance? }`
 * (P1-2). Tolerates fenced blocks + an optional `{ episode: {...} }`
 * wrapper; returns `null` when no usable `summary` string is present
 * (so an extraction-shaped `{ facts: [...] }` payload is rejected, not
 * mistaken for an episode).
 *
 * @internal
 */
export function parseEpisode(text: string | undefined): ExtractedEpisode | null {
  if (text === undefined || text.length === 0) return null;
  const candidate = stripFence(text).trim();
  if (candidate.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    const slice = sliceJsonObject(candidate);
    if (slice === null) return null;
    try {
      parsed = JSON.parse(slice);
    } catch {
      return null;
    }
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  const root = parsed as Record<string, unknown>;
  const inner =
    typeof root.summary === 'string'
      ? root
      : root.episode !== null && typeof root.episode === 'object'
        ? (root.episode as Record<string, unknown>)
        : root;
  const summary = typeof inner.summary === 'string' ? inner.summary : null;
  if (summary === null || summary.trim().length === 0) return null;
  return {
    summary,
    ...(typeof inner.importance === 'number' ? { importance: inner.importance } : {}),
  };
}

/**
 * Normalize a raw `[1, 10]` poignancy score into the episodic
 * `importance` field's `[0, 1]` range (P1-2). Out-of-range values are
 * clamped to `[1, 10]` first (so `15 → 1.0`, `0 → 0.1`); non-finite /
 * missing scores return `undefined` so the episode is recorded without
 * an importance signal rather than a bogus one.
 *
 * @internal
 */
export function normalizeImportance(raw: number | undefined): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
  const clamped = Math.min(10, Math.max(1, raw));
  return clamped / 10;
}

/**
 * Build the {@link FactInput} for an extracted candidate. P1-4:
 * distilled-from-transcript facts are synthesized memory - tagged
 * `extraction` so they land quarantined (excluded from action-driving
 * recall until validated).
 */
/**
 * Embedder-independent exact-duplicate lookup
 * (memory-consolidation-07): FTS top hits + strict string equality.
 * Returns the existing fact's id or `null`. Failures are swallowed -
 * the guard is an optimization, never a reason to fail the slice.
 */
async function findExactTextDuplicate(
  semantic: SemanticMemory,
  scope: SessionScope,
  text: string,
): Promise<string | null> {
  try {
    // Extraction output lands quarantined (P1-4) - the committed copy a
    // replay would duplicate is exactly a quarantined row, so the guard
    // must look past the retrieval gate.
    const hits = await semantic.search(scope, text, { topK: 5, includeQuarantined: true });
    return hits.find((h) => h.record.text === text)?.record.id ?? null;
  } catch {
    return null;
  }
}

function buildFactInput(fact: ExtractedFact): FactInput {
  // MCON-12: normalize the model's raw [1, 10] importance into the
  // [0.1, 1.0] store scale (same contract as episodes); non-finite raw
  // scores drop the signal rather than fabricating one.
  const importance = normalizeImportance(fact.importance);
  return {
    text: fact.text,
    provenance: 'extraction',
    // D3: an extracted fact is the agent's own inference about the user.
    owner: 'agent',
    ...(fact.subject !== undefined ? { subject: fact.subject } : {}),
    ...(fact.predicate !== undefined ? { predicate: fact.predicate } : {}),
    ...(fact.object !== undefined ? { object: fact.object } : {}),
    ...(fact.confidence !== undefined ? { confidence: fact.confidence } : {}),
    ...(importance !== undefined ? { importance } : {}),
  };
}

/**
 * Record a reconcile / pre-filter decision into `fact_conflicts` so every
 * write-path decision stays auditable (P0-3). Best-effort: a storage
 * adapter without the conflict surface simply skips it.
 */
async function recordConflictDecision(
  store: MemoryStoreAdapter,
  scope: SessionScope,
  candidateId: string,
  decision: ConflictDecision,
): Promise<void> {
  const conflicts = store.conflicts;
  if (conflicts === undefined) return;
  await conflicts.recordDecision({
    scope,
    candidateId,
    decision: decision.kind,
    stage: decision.stage,
    ...(decision.kind === 'dedup' || decision.kind === 'supersede'
      ? { existingId: decision.existingId }
      : {}),
    ...(decision.kind === 'dedup' && decision.similarity !== undefined
      ? { similarity: decision.similarity }
      : {}),
    ...(decision.reason !== undefined ? { reason: decision.reason } : {}),
    detectedBy: 'reconcile',
  });
}

function emptyOutcome(status: PhaseOutcome['status']): PhaseOutcome {
  return {
    phase: 'standard',
    status,
    factsCreated: 0,
    factsUpdated: 0,
    conflictsResolved: 0,
    episodesFormed: 0,
    insightsCreated: 0,
    noiseFilteredCount: 0,
    emptyExtractions: 0,
    llmTokensUsed: 0,
    llmCostUsd: null,
    errorMessage: null,
  };
}
