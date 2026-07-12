/**
 * Public types for the Phase 10c consolidator runtime.
 *
 * The consolidator is the background pipeline that turns raw
 * conversation turns into long-lived facts and episodes. The runtime
 * has three phases (`light` / `standard` / `deep`), an explicit cost
 * envelope, an idempotent cursor, a wait-then-defer lock, and a
 * dead-letter queue for retry-able failures. The binding architecture
 * references are DEC-133 / DEC-134 / ADR-038.
 *
 * @packageDocumentation
 */

import type { Provider, SessionScope, Tracer } from '@graphorin/core';
import type { ContextualRetrievalMode } from '../internal/contextualize.js';
import type { MemoryStoreAdapter, SessionMessageRecord } from '../internal/storage-adapter.js';
import type { EpisodicMemory } from '../tiers/episodic-memory.js';
import type { SemanticMemory } from '../tiers/semantic-memory.js';
import type { WorkingMemory } from '../tiers/working-memory.js';
import type { SalienceWeights } from './decay.js';
import type { CuratedBlockSpec, ResolvedCuratedBlock } from './phases/learned-context.js';
import type {
  ProfileProjectionConfig,
  ResolvedProfileProjectionConfig,
} from './phases/profile-projection.js';

/**
 * B3 (item 15): deterministic pre-extraction admission gate. Runs on
 * every fetched {@link SessionMessageRecord} BEFORE noise filtering on
 * both consolidator batch paths (runtime dispatch pre-fetch and the
 * standard phase's self-fetch). Return `true` to admit the record
 * into extraction. Excluded records still advance the idempotency
 * cursor - a blocked turn can never wedge consolidation. A throwing
 * gate excludes the record (fail-closed).
 *
 * @stable
 */
export type MemoryIngestGate = (record: SessionMessageRecord) => boolean;

/**
 * The canonical verdict-driven ingest gate: excludes turns whose
 * persisted {@link SessionMessageRecord.verdict} says an input/output
 * guardrail BLOCKED the turn or the lateral-leak defense withheld it.
 * Rewritten turns pass - the stored message already carries the
 * rewritten text. Records without a verdict pass untouched.
 *
 * @stable
 */
export function verdictIngestGate(record: SessionMessageRecord): boolean {
  const verdict = record.verdict;
  if (verdict === undefined) return true;
  if (verdict.guardrail === 'block') return false;
  if (verdict.lateralLeak === true) return false;
  return true;
}

/**
 * Trigger discriminator. The `'turn:N'` and `'idle:Xm'` variants are
 * the production defaults per DEC-133. `'cron:EXPR'`, `'event:NAME'`
 * and `'budget:N'` are opt-in.
 *
 * @stable
 */
export type ConsolidatorTriggerSpec =
  | `turn:${number}`
  | `idle:${string}`
  | `cron:${string}`
  | `event:${string}`
  | `budget:${number}`
  | `buffer:${number}`;

/**
 * Tier preset that selects a consolidator behaviour bundle. The
 * `'free'` preset is the default per DEC-144 / ADR-038 - no LLM call
 * fires until the operator opts in.
 *
 * @stable
 */
export type ConsolidatorTier = 'free' | 'cheap' | 'standard' | 'full' | 'custom';

/**
 * Triggering reason surfaced through `Consolidator.trigger(...)`.
 *
 * @stable
 */
export interface ConsolidatorTriggerReason {
  readonly kind: 'turn' | 'idle' | 'cron' | 'event' | 'budget' | 'buffer' | 'manual';
  readonly value?: string | number;
}

/**
 * Daily cost ceilings, tracked per budget window. How a breach is
 * handled depends on {@link OnBudgetExceed}: `'pause'` / `'throw'`
 * enforce, `'log'` (the shipped standard/full presets) only WARNs and
 * keeps running. The USD leg accumulates only when a `priceUsage`
 * pricer is configured (memory-consolidation-02) - without one every
 * call prices at $0 and `maxCostPerDay` can never trip. The default
 * ceiling shape per tier is captured in
 * {@link CONSOLIDATOR_TIER_DEFAULTS}.
 *
 * @stable
 */
export interface ConsolidatorCeilings {
  readonly maxTokensPerDay: number;
  readonly maxCostPerDay: number;
  /**
   * ADVISORY (MCON-8): the per-scope lock serializes runs, so effective
   * concurrency is always 1 per scope regardless of this value. The
   * field is retained for forward compatibility; it enforces nothing
   * today.
   */
  readonly maxConcurrentRuns: number;
  readonly maxRunDurationMs: number;
  /**
   * Minimum quiet period between non-manual runs per scope (MCON-8).
   * After each run the runtime persists `nextEligibleAt = now +
   * cooldownMs`; trigger-driven runs (`turn` / `idle` / `cron` /
   * `event` / `budget`) inside that window defer with reason
   * `'cooldown'`. Manual `fireNow(...)` and DLQ replays bypass it.
   */
  readonly cooldownMs: number;
}

/**
 * Behaviour applied by the budget enforcer when a ceiling is hit
 * mid-run. `'pause'` is the conservative default - the consolidator
 * skips subsequent runs until the next budget reset; `'log'` keeps
 * running with a WARN; `'throw'` raises a typed
 * {@link BudgetExceededError}.
 *
 * @stable
 */
export type OnBudgetExceed = 'pause' | 'log' | 'throw';

/**
 * Phase identifier used by the runtime + audit rows.
 *
 * @stable
 */
export type ConsolidatorPhase = 'light' | 'standard' | 'deep';

/**
 * Locked-down configuration accepted by `createConsolidator(...)`.
 *
 * @stable
 */
export interface ConsolidatorConfig {
  readonly triggers: ReadonlyArray<ConsolidatorTriggerSpec>;
  readonly tier: ConsolidatorTier;
  readonly phases: ReadonlyArray<ConsolidatorPhase>;
  readonly ceilings: ConsolidatorCeilings;
  readonly onExceed: OnBudgetExceed;
  /**
   * Advisory label for the standard phase's model - recorded on spans /
   * run telemetry only (MCON-7). Routing happens via
   * `CreateConsolidatorOptions.cheapProvider`; this string disables
   * nothing.
   */
  readonly cheapModel: string | null;
  /**
   * Advisory label for the deep phase's model - telemetry only
   * (MCON-7). Routing happens via
   * `CreateConsolidatorOptions.deepProvider`.
   */
  readonly deepModel: string | null;
  readonly budgetResetSemantics: 'utc' | 'local' | 'sliding-24h';
  readonly noiseFilters: ReadonlyArray<'default' | 'minimal' | 'none'>;
  /**
   * B3 (item 15): deterministic pre-extraction admission gate. `null`
   * (default) admits everything. See {@link MemoryIngestGate}.
   */
  readonly ingestGate: MemoryIngestGate | null;
  readonly lockWaitMs: number;
  readonly decayTauDays: number;
  readonly decayArchiveThreshold: number;
  /**
   * Capacity-bounded eviction target for the light phase (X-1). When set,
   * each light pass archives the lowest-salience live facts in the LRU
   * decay window down to this many - **cost / staleness control, not an
   * accuracy lever**. `null` (the default at every tier) leaves storage
   * unbounded, so behaviour is identical to pre-X-1. Archiving is a soft,
   * recoverable move; nothing is hard-deleted.
   */
  readonly decayCapacity: number | null;
  /**
   * Weights for the multi-signal salience score (X-1) that orders both
   * threshold archiving and capacity eviction. Defaults to
   * `DEFAULT_SALIENCE_WEIGHTS`; with neutral importance, active
   * status, and first-party provenance salience equals plain retention.
   */
  readonly salienceWeights: SalienceWeights;
  readonly maxStandardBatchSize: number;
  /**
   * Input-side transcript budget for the standard phase, in characters
   * (W-081; chars/4 is the package's deterministic token proxy, so the
   * 60k default approximates 15k tokens). `maxStandardBatchSize` bounds
   * only the MESSAGE COUNT of a slice; without a size budget a batch of
   * near-cap messages can render to hundreds of kilobytes, overflow a
   * cheap-tier model context on every retry and wedge the cursor
   * permanently. A transcript over this budget is half-split BEFORE the
   * provider call (same convergent recursion as the
   * `finishReason: 'length'` output handling); a single message that
   * alone exceeds the budget is tail-truncated and recorded on the
   * phase span. Conservative for CJK scripts by design.
   */
  readonly maxTranscriptChars: number;
  readonly maxDeepConflictsPerRun: number;
  readonly dlqMaxRetries: number;
  readonly dlqBaseBackoffMs: number;
  readonly dlqMaxBackoffMs: number;
  /**
   * Auto-form a quarantined episode from each processed standard-phase
   * slice (P1-2). Defaults on at the `standard`+ tiers, off at `free` /
   * `cheap` / `custom`. The episode summary is one budgeted LLM call;
   * when the budget is exhausted (or no episodic tier is wired) the
   * phase degrades to fact-only behaviour.
   */
  readonly formEpisodes: boolean;
  /**
   * Ask the episode-summarization call for an LLM importance score
   * (1-10, normalized to `[0, 1]`) so episodic triple-signal retrieval
   * (recency × relevance × importance) runs on all three signals
   * (P1-2). Importance is always a *soft* signal - it never gates
   * retention. Defaults track {@link formEpisodes}.
   */
  readonly importanceScoring: boolean;
  /**
   * Auto-promotion policy (MCON-2). When `true`, the standard phase admits an
   * injection-clean **extraction** fact as `active` instead of quarantined, so
   * routine distillation surfaces in default recall without a manual
   * `memory review --promote`. Injection-flagged facts always stay quarantined
   * - the security gate is preserved - and episodes / insights / induced
   * procedures are unaffected (they remain quarantined-until-validated).
   * Defaults **off** at every tier: it trades the fail-safe default for
   * convenience and is an explicit operator opt-in.
   */
  readonly autoPromoteExtraction: boolean;
  /**
   * Run the deep-phase reflection pass (P1-1): when accumulated episode
   * importance crosses {@link importanceThreshold}, synthesize
   * higher-order, cited insights over recent memories (Generative
   * Agents). Insights land quarantined + `provenance: 'reflection'` and
   * are ranked below the facts they cite. Defaults **on at the `full`
   * tier only** (off at `free` / `cheap` / `standard` / `custom`) - it
   * is the most LLM-intensive phase. A no-op without an episodic tier
   * or an insight-capable storage adapter.
   */
  readonly reflection: boolean;
  /**
   * Sum of recent episode importance (each in `[0, 1]`) at or above
   * which {@link reflection} fires. Below it the pass makes no LLM
   * call. Defaults to `3`.
   */
  readonly importanceThreshold: number;
  /** Upper bound on salient questions reflection asks per pass. Defaults to `3`. */
  readonly reflectionMaxQuestions: number;
  /**
   * W-082: cap on the unreviewed (quarantined) insight queue. Quarantined
   * insights are exempt from reflection pass-decay - their decay clock
   * starts at validation - and this bound keeps the review queue from
   * growing without limit: beyond it the oldest quarantined insights are
   * pruned. Defaults to `100`.
   */
  readonly reflectionMaxQuarantinedInsights: number;
  /**
   * Contextual retrieval for facts written by the standard phase (P1-3).
   * `'late-chunk'` (default at every tier) relies on the offline
   * situating-context prefix the shared {@link SemanticMemory} computes
   * for every write - no extra LLM call. `'llm'` is the opt-in
   * enrichment: the standard phase spends one budgeted cheap-model call
   * per additive write to author a 1-2 sentence situating prefix, then
   * passes it as the write's index text. `'off'` indexes the bare text.
   * The `'llm'` mode is **consolidator-only** by construction - the hot
   * write path never has a provider for contextualization.
   */
  readonly contextualRetrieval: ContextualRetrievalMode;
  /**
   * Maintain the learned-context digest block (D3): after the deep
   * phase, one budgeted LLM call rewrites the reserved
   * `learned_context` working block from the previous digest + recent
   * episodes / active insights / active procedures, so the system
   * prompt carries a compact standing summary. Defaults **off at every
   * tier** (Wave-D trial) - a no-op without a working tier handle.
   */
  readonly learnedContext: boolean;
  /** Character bound enforced on the learned-context digest. Default `1200`. */
  readonly learnedContextMaxChars: number;
  /**
   * Curated working blocks the deep phase maintains (wave-D D3) - the
   * generalisation of the learned-context pass to a registered list.
   * Resolved: the `learnedContext: true` sugar contributes a
   * `learned_context` entry; labels are unique and never `profile`.
   * Empty ⇒ no curated-block rewrites run.
   */
  readonly curatedBlocks: ReadonlyArray<ResolvedCuratedBlock>;
  /**
   * Profile-projection pass configuration (wave-D D2): after the
   * curated-block passes, one budgeted LLM call projects ACTIVE facts
   * into the reserved read-only `profile` working block (topic /
   * sub-topic / content slots with fact-id provenance). `null` (the
   * default at every tier) disables the pass. Configured through
   * `createMemory({ profile })`, not per-tier.
   */
  readonly profileProjection: ResolvedProfileProjectionConfig | null;
}

/**
 * Per-phase last-run snapshot surfaced inside
 * {@link ConsolidatorStatus.lastRuns}. Each entry carries the
 * timestamp of the most recent **completed** invocation for that
 * phase (`undefined` when the phase has never run).
 *
 * @stable
 */
export interface ConsolidatorLastRuns {
  readonly light?: string;
  readonly standard?: string;
  readonly deep?: string;
}

/**
 * Budget snapshot block of {@link ConsolidatorStatus}. Surfaces
 * both the absolute usage and the remaining envelope so consumers
 * (CLI, server health endpoint) can render the operator dashboard
 * without doing the math themselves.
 *
 * @stable
 */
export interface ConsolidatorBudgetSnapshot {
  readonly tokensUsedToday: number;
  readonly costUsedToday: number;
  readonly tokensRemaining: number;
  readonly costRemaining: number;
  readonly resetAt: string;
}

/**
 * Status snapshot returned by {@link Consolidator.status}.
 *
 * Public shape: `{ tier, queueDepth, dlqSize, lastRuns,
 * budgetRemaining, deferredRuns }` - extended with a few additional
 * fields the server health endpoint and the
 * `graphorin consolidator status` CLI consume.
 *
 * `queueDepth` is an alias for {@link pendingConflicts} (the size
 * of the deep-phase queue); both fields are populated for backwards
 * compatibility.
 *
 * @stable
 */
export interface ConsolidatorStatus {
  readonly tier: ConsolidatorTier;
  readonly triggers: ReadonlyArray<ConsolidatorTriggerSpec>;
  readonly phases: ReadonlyArray<ConsolidatorPhase>;
  readonly running: boolean;
  readonly paused: boolean;
  /** Most recent completed run timestamp (any phase). */
  readonly lastRunAt?: string;
  /** Phase of the most recent completed run. */
  readonly lastPhase?: ConsolidatorPhase;
  /** Per-phase last-completed timestamps surfaced for CLI / dashboard. */
  readonly lastRuns: ConsolidatorLastRuns;
  /** Spec alias for {@link pendingConflicts}. */
  readonly queueDepth: number;
  readonly pendingConflicts: number;
  readonly dlqSize: number;
  readonly deferredRuns: number;
  readonly emptyExtractions: number;
  readonly budget: ConsolidatorBudgetSnapshot;
  /** Spec alias - surfaces remaining-budget figures at the top level. */
  readonly budgetRemaining: {
    readonly tokens: number;
    readonly costUsd: number;
  };
}

/**
 * Outcome surfaced by every phase invocation. Recorded into
 * `consolidator_runs` and emitted on the AISpan.
 *
 * @stable
 */
export interface PhaseOutcome {
  readonly phase: ConsolidatorPhase;
  readonly status: 'completed' | 'failed' | 'deferred' | 'partial';
  readonly factsCreated: number;
  readonly factsUpdated: number;
  readonly conflictsResolved: number;
  /** Episodes auto-formed from the processed slice (P1-2). */
  readonly episodesFormed: number;
  /** Insights synthesized by the deep-phase reflection pass (P1-1). */
  readonly insightsCreated: number;
  /** True when the learned-context digest block was rewritten (D3). */
  readonly learnedContextUpdated?: boolean;
  /** How many curated blocks were rewritten this pass (wave-D D3). */
  readonly curatedBlocksUpdated?: number;
  /** True when the profile block content changed (wave-D D2). */
  readonly profileProjectionUpdated?: boolean;
  readonly noiseFilteredCount: number;
  readonly emptyExtractions: number;
  readonly llmTokensUsed: number;
  readonly llmCostUsd: number | null;
  readonly errorMessage: string | null;
}

/**
 * Listener callback subscribed via
 * {@link Consolidator.onPhaseFinished}. Useful for tests + observers.
 *
 * @stable
 */
export type PhaseListener = (
  outcome: PhaseOutcome & {
    readonly scope: SessionScope;
    readonly trigger: ConsolidatorTriggerReason;
  },
) => void;

/**
 * Options accepted by {@link createConsolidator}.
 *
 * @stable
 */
export interface CreateConsolidatorOptions {
  /**
   * Storage adapter - supplies the consolidator state, runs, DLQ,
   * and per-tier helpers. The default `@graphorin/store-sqlite`
   * adapter exposes everything by construction.
   */
  readonly store: MemoryStoreAdapter;
  /**
   * The {@link SemanticMemory} tier instance from the parent
   * `createMemory(...)` facade. The standard phase routes every
   * extracted fact through `semantic.remember(...)` so the conflict
   * pipeline (Phase 10b) handles dedup / supersede.
   */
  readonly semantic: SemanticMemory;
  /**
   * The {@link EpisodicMemory} tier instance from the parent
   * `createMemory(...)` facade. When supplied (and `formEpisodes` is
   * on) the standard phase auto-forms a quarantined episode per
   * processed slice (P1-2). Omitted ⇒ episode formation is skipped.
   */
  readonly episodic?: EpisodicMemory;
  /**
   * The {@link WorkingMemory} tier instance from the parent
   * `createMemory(...)` facade (D3). Required for the learned-context
   * pass - without it the pass is a silent no-op even when
   * `learnedContext` is enabled.
   */
  readonly working?: WorkingMemory;
  /**
   * Provider used by the standard + deep phases. Required when the
   * tier enables either phase; ignored when the active phases
   * collapse to `['light']`.
   */
  readonly provider?: Provider | null;
  readonly tracer?: Tracer;
  /** Override the wall clock - used by tests. */
  readonly now?: () => number;
  /** Random source for stable run ids - used by tests. */
  readonly randomId?: () => string;
  readonly triggers?: ReadonlyArray<ConsolidatorTriggerSpec>;
  readonly tier?: ConsolidatorTier;
  readonly phases?: ReadonlyArray<ConsolidatorPhase>;
  readonly ceilings?: Partial<ConsolidatorCeilings>;
  readonly onExceed?: OnBudgetExceed;
  /**
   * USD pricer for phase LLM usage (memory-consolidation-02). Wire it
   * to `@graphorin/pricing`'s `calculateCost` (or any per-token rate)
   * so the `maxCostPerDay` ceiling can actually accumulate spend -
   * without it every phase prices its calls at $0 and the USD ceiling
   * never trips at any tier.
   *
   * ```ts
   * priceUsage: ({ promptTokens, completionTokens }) =>
   *   (promptTokens * 3 + completionTokens * 15) / 1_000_000
   * ```
   */
  readonly priceUsage?: (usage: { promptTokens: number; completionTokens: number }) => number;
  /**
   * Provider routed to the standard phase (extraction / episode /
   * reconcile / situating-context calls) when set (MCON-7). Falls back
   * to `provider`. Pair with `cheapModel` for the telemetry label.
   */
  readonly cheapProvider?: Provider | null;
  /**
   * Provider routed to the deep phase (conflict judge) and the
   * reflection pass when set (MCON-7). Falls back to `provider`.
   */
  readonly deepProvider?: Provider | null;
  readonly cheapModel?: string | null;
  readonly deepModel?: string | null;
  readonly budgetResetSemantics?: 'utc' | 'local' | 'sliding-24h';
  readonly noiseFilters?: ReadonlyArray<'default' | 'minimal' | 'none'>;
  /** B3: override {@link ConsolidatorConfig.ingestGate}. */
  readonly ingestGate?: MemoryIngestGate;
  readonly lockWaitMs?: number;
  readonly decayTauDays?: number;
  readonly decayArchiveThreshold?: number;
  /** Override the {@link ConsolidatorConfig.decayCapacity} default (X-1). */
  readonly decayCapacity?: number | null;
  /** Override the {@link ConsolidatorConfig.salienceWeights} default (X-1). */
  readonly salienceWeights?: SalienceWeights;
  readonly maxStandardBatchSize?: number;
  /** Override the per-tier {@link ConsolidatorConfig.maxTranscriptChars} default (W-081). */
  readonly maxTranscriptChars?: number;
  readonly maxDeepConflictsPerRun?: number;
  readonly dlqMaxRetries?: number;
  readonly dlqBaseBackoffMs?: number;
  readonly dlqMaxBackoffMs?: number;
  /** Override the per-tier {@link ConsolidatorConfig.formEpisodes} default (P1-2). */
  readonly formEpisodes?: boolean;
  /** Override the per-tier {@link ConsolidatorConfig.importanceScoring} default (P1-2). */
  readonly importanceScoring?: boolean;
  /**
   * Opt in to auto-promotion of injection-clean extraction facts (MCON-2).
   * Defaults `false`. See {@link ConsolidatorConfig.autoPromoteExtraction}.
   */
  readonly autoPromoteExtraction?: boolean;
  /** Override the per-tier {@link ConsolidatorConfig.reflection} default (P1-1). */
  readonly reflection?: boolean;
  /** Override the {@link ConsolidatorConfig.importanceThreshold} default (P1-1). */
  readonly importanceThreshold?: number;
  /** Override the {@link ConsolidatorConfig.reflectionMaxQuestions} default (P1-1). */
  readonly reflectionMaxQuestions?: number;
  /** Override the {@link ConsolidatorConfig.reflectionMaxQuarantinedInsights} default (W-082). */
  readonly reflectionMaxQuarantinedInsights?: number;
  /** Override the per-tier {@link ConsolidatorConfig.contextualRetrieval} default (P1-3). */
  readonly contextualRetrieval?: ContextualRetrievalMode;
  /** Override the per-tier {@link ConsolidatorConfig.learnedContext} default (D3). */
  readonly learnedContext?: boolean;
  /** Override the {@link ConsolidatorConfig.learnedContextMaxChars} default (D3). */
  readonly learnedContextMaxChars?: number;
  /**
   * Curated working blocks the deep phase maintains (wave-D D3).
   * `learnedContext: true` remains sugar for
   * `[{ label: 'learned_context' }]` and composes with this list.
   */
  readonly curatedBlocks?: ReadonlyArray<CuratedBlockSpec>;
  /** Enable the profile-projection pass (wave-D D2). Default off. */
  readonly profileProjection?: ProfileProjectionConfig;
  /** Default scope used by event triggers + the manual `fireNow` path. */
  readonly defaultScope?: SessionScope;
}

/**
 * Tier preset table. The defaults follow ADR-038 §4 - `'free'`
 * disables every LLM phase and pins zero ceilings, the upper tiers
 * widen the budget envelope progressively.
 *
 * @stable
 */
export const CONSOLIDATOR_TIER_DEFAULTS: Readonly<
  Record<
    ConsolidatorTier,
    {
      readonly ceilings: ConsolidatorCeilings;
      readonly phases: ReadonlyArray<ConsolidatorPhase>;
      readonly cheapModel: string | null;
      readonly deepModel: string | null;
      readonly onExceed: OnBudgetExceed;
      /** W-081: input transcript budget for one standard-phase slice. */
      readonly maxTranscriptChars: number;
      readonly formEpisodes: boolean;
      readonly importanceScoring: boolean;
      readonly reflection: boolean;
      readonly importanceThreshold: number;
      readonly reflectionMaxQuestions: number;
      readonly reflectionMaxQuarantinedInsights: number;
      readonly contextualRetrieval: ContextualRetrievalMode;
      readonly learnedContext: boolean;
      readonly learnedContextMaxChars: number;
    }
  >
> = Object.freeze({
  free: {
    ceilings: {
      maxTokensPerDay: 0,
      maxCostPerDay: 0,
      maxConcurrentRuns: 1,
      maxRunDurationMs: 5 * 60 * 1000,
      cooldownMs: 60_000,
    },
    phases: ['light'],
    cheapModel: null,
    deepModel: null,
    onExceed: 'pause',
    maxTranscriptChars: 60_000,
    formEpisodes: false,
    importanceScoring: false,
    reflection: false,
    importanceThreshold: 3,
    reflectionMaxQuestions: 3,
    reflectionMaxQuarantinedInsights: 100,
    contextualRetrieval: 'late-chunk',
    learnedContext: false,
    learnedContextMaxChars: 1200,
  },
  cheap: {
    ceilings: {
      maxTokensPerDay: 50_000,
      maxCostPerDay: 0.2,
      maxConcurrentRuns: 1,
      maxRunDurationMs: 5 * 60 * 1000,
      cooldownMs: 60_000,
    },
    phases: ['light', 'standard'],
    cheapModel: null,
    deepModel: null,
    onExceed: 'pause',
    maxTranscriptChars: 60_000,
    formEpisodes: false,
    importanceScoring: false,
    reflection: false,
    importanceThreshold: 3,
    reflectionMaxQuestions: 3,
    reflectionMaxQuarantinedInsights: 100,
    contextualRetrieval: 'late-chunk',
    learnedContext: false,
    learnedContextMaxChars: 1200,
  },
  standard: {
    ceilings: {
      maxTokensPerDay: 200_000,
      maxCostPerDay: 1.0,
      maxConcurrentRuns: 1,
      maxRunDurationMs: 10 * 60 * 1000,
      cooldownMs: 30_000,
    },
    phases: ['light', 'standard', 'deep'],
    cheapModel: null,
    deepModel: null,
    onExceed: 'log',
    maxTranscriptChars: 60_000,
    formEpisodes: true,
    importanceScoring: true,
    reflection: false,
    importanceThreshold: 3,
    reflectionMaxQuestions: 3,
    reflectionMaxQuarantinedInsights: 100,
    contextualRetrieval: 'late-chunk',
    learnedContext: false,
    learnedContextMaxChars: 1200,
  },
  full: {
    ceilings: {
      maxTokensPerDay: 1_000_000,
      maxCostPerDay: 5.0,
      maxConcurrentRuns: 2,
      maxRunDurationMs: 15 * 60 * 1000,
      cooldownMs: 10_000,
    },
    phases: ['light', 'standard', 'deep'],
    cheapModel: null,
    deepModel: null,
    onExceed: 'log',
    // Full-tier models carry wider contexts - a larger input budget
    // keeps slices coarse (fewer calls) without risking overflow.
    maxTranscriptChars: 120_000,
    formEpisodes: true,
    importanceScoring: true,
    reflection: true,
    importanceThreshold: 3,
    reflectionMaxQuestions: 3,
    reflectionMaxQuarantinedInsights: 100,
    contextualRetrieval: 'late-chunk',
    learnedContext: false,
    learnedContextMaxChars: 1200,
  },
  custom: {
    ceilings: {
      maxTokensPerDay: 0,
      maxCostPerDay: 0,
      maxConcurrentRuns: 1,
      maxRunDurationMs: 5 * 60 * 1000,
      cooldownMs: 60_000,
    },
    phases: ['light'],
    cheapModel: null,
    deepModel: null,
    onExceed: 'pause',
    maxTranscriptChars: 60_000,
    formEpisodes: false,
    importanceScoring: false,
    reflection: false,
    importanceThreshold: 3,
    reflectionMaxQuestions: 3,
    reflectionMaxQuarantinedInsights: 100,
    contextualRetrieval: 'late-chunk',
    learnedContext: false,
    learnedContextMaxChars: 1200,
  },
});
