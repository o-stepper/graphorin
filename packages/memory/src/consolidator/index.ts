/**
 * `@graphorin/memory/consolidator` - Phase 10c runtime that turns
 * raw conversation turns into long-lived facts and episodes. The
 * module ships:
 *
 * - {@link createConsolidator} - the production factory that wires
 *   triggers, the budget envelope, the wait-then-defer lock, the
 *   idempotent cursor, the DLQ, and the three phases (light /
 *   standard / deep) into a single `Consolidator` handle.
 * - {@link createConsolidatorPlaceholder} - kept for back-compat
 *   with consumers that wired the no-op stub during Phase 10a; it
 *   honours the same shape but does no background work.
 * - Pure helpers (`noise-filter`, `decay`, `budget`, `lock`, `dlq`,
 *   `idempotency`, `triggers`) and the per-phase orchestrators -
 *   exported so tests + the standalone server (Phase 14) can compose
 *   them without re-implementing the algorithm.
 *
 * The `Consolidator` interface is **stable** - Phase 14 wires the
 * runtime into the lifecycle hooks, and Phase 15 surfaces every
 * method through `graphorin consolidator …` CLI commands.
 *
 * @packageDocumentation
 */

import { DEFAULT_SALIENCE_WEIGHTS } from './decay.js';
import type { Consolidator } from './runtime.js';
import type {
  ConsolidatorConfig,
  ConsolidatorPhase,
  ConsolidatorStatus,
  ConsolidatorTier,
  ConsolidatorTriggerSpec,
  PhaseListener,
  PhaseOutcome,
} from './types.js';

export {
  type BudgetCheck,
  type BudgetSnapshot,
  BudgetTracker,
  type BudgetTrackerOptions,
  bucketStart,
  nextBucketStart,
} from './budget.js';
export {
  DEFAULT_DECAY_ARCHIVE_THRESHOLD,
  DEFAULT_DECAY_TAU_DAYS,
  DEFAULT_SALIENCE_WEIGHTS,
  NEUTRAL_IMPORTANCE,
  retention,
  type SalienceWeights,
  salience,
  selectForCapacityEviction,
  shouldArchive,
} from './decay.js';
export {
  classifyError,
  describeError,
  nextBackoffMs,
} from './dlq.js';
export {
  BudgetExceededError,
  CuratedBlocksMisconfiguredError,
  CustomTierMisconfiguredError,
  IngestGateRequiredError,
  ProviderNotConfiguredError,
} from './errors.js';
export { tipMessageId } from './idempotency.js';
export { LockManager, type LockManagerOptions, type LockOutcome } from './lock.js';
export {
  applyNoiseFilters,
  type NoiseFilterPreset,
  type NoiseFilterResult,
} from './noise-filter.js';
export { type DeepPhaseDeps, runDeepPhase } from './phases/deep.js';
export {
  buildInductionRequest,
  checkSuccessCriteria,
  createProviderWorkflowInducer,
  DEFAULT_INDUCTION_MAX_TOKENS,
  INDUCTION_SYSTEM_PROMPT,
  type InducedProcedure,
  MAX_PROCEDURE_STEPS,
  MAX_TRAJECTORY_STEPS_SHOWN,
  normalizeInducedProcedure,
  parseInducedProcedure,
  runWorkflowInduction,
  type Trajectory,
  type TrajectoryStep,
  trajectoryFromRunState,
  type VerificationResult,
  type WorkflowInducer,
  type WorkflowInductionOptions,
} from './phases/induce.js';
export {
  buildLearnedContextRequest,
  type CuratedBlockDeps,
  type CuratedBlockSpec,
  curatedBlockSystemPrompt,
  DEFAULT_LEARNED_CONTEXT_MAX_CHARS,
  LEARNED_CONTEXT_BLOCK_LABEL,
  type LearnedContextDeps,
  type LearnedContextOutcome,
  normalizeLearnedContext,
  type ResolvedCuratedBlock,
  runCuratedBlockPass,
  runLearnedContextPass,
} from './phases/learned-context.js';
export {
  type LightPhaseDeps,
  runLightPhase,
} from './phases/light.js';
export {
  buildProfileProjectionRequest,
  DEFAULT_PROFILE_MAX_CHARS,
  DEFAULT_PROFILE_MAX_SLOTS,
  PROFILE_BLOCK_LABEL,
  type ProfileProjectionConfig,
  type ProfileProjectionDeps,
  type ProfileProjectionOutcome,
  type ProfileSlot,
  parseProfileSlots,
  type ResolvedProfileProjectionConfig,
  renderProfileBlock,
  resolveProfileProjectionConfig,
  runProfileProjectionPass,
} from './phases/profile-projection.js';
export {
  parseExtraction,
  runStandardPhase,
  type StandardPhaseDeps,
} from './phases/standard.js';
export {
  type ReviserConsolidatorConfig,
  type ReviserPresetOptions,
  reviserConsolidatorPreset,
} from './presets.js';
export {
  type PromotionCandidate,
  type PromotionPolicyConfig,
  type ResolvedPromotionPolicy,
  resolvePromotionPolicy,
  shouldPromote,
} from './promotion.js';
export { type Consolidator, createConsolidator } from './runtime.js';
export {
  type ConsolidatorCatchupPolicy,
  type ConsolidatorLike,
  type RegisterTriggersOptions,
  type RegisterTriggersResult,
  registerConsolidatorTriggers,
  type SchedulerLike,
  type TriggerDeclarationLike,
} from './scheduler.js';
export {
  type ParsedTrigger,
  parseTriggerSpec,
  reasonFromTrigger,
} from './triggers.js';
export type {
  ConsolidatorBudgetSnapshot,
  ConsolidatorCeilings,
  ConsolidatorConfig,
  ConsolidatorLastRuns,
  ConsolidatorPhase,
  ConsolidatorStatus,
  ConsolidatorTier,
  ConsolidatorTriggerReason,
  ConsolidatorTriggerSpec,
  CreateConsolidatorOptions,
  MemoryIngestGate,
  OnBudgetExceed,
  PhaseListener,
  PhaseOutcome,
} from './types.js';
export { CONSOLIDATOR_TIER_DEFAULTS, verdictIngestGate } from './types.js';

/**
 * Build a no-op consolidator that honours the full {@link Consolidator}
 * interface but performs no background work. Useful for consumers
 * that want the typed shape (e.g., unit tests of higher tiers) but
 * do not pay the runtime cost of triggers / locking / DLQ.
 *
 * Phase 10c's {@link createConsolidator} is the production factory.
 *
 * @stable
 */
export function createConsolidatorPlaceholder(
  options: {
    readonly triggers?: ReadonlyArray<ConsolidatorTriggerSpec>;
    readonly tier?: ConsolidatorTier;
  } = {},
): Consolidator {
  let running = false;
  let paused = false;
  let tier: ConsolidatorTier = options.tier ?? 'free';
  const triggers = Object.freeze([
    // Matches the real runtime default (MCON-4): idle drives light/standard,
    // the daily cron makes the deep phase reachable; turn:N is consumer-emitted
    // so it is not a scheduler default.
    ...(options.triggers ?? (['idle:5m', 'cron:0 4 * * *'] as ConsolidatorTriggerSpec[])),
  ]) as ReadonlyArray<ConsolidatorTriggerSpec>;
  const listeners = new Set<PhaseListener>();

  const config: ConsolidatorConfig = Object.freeze({
    triggers,
    tier,
    phases: Object.freeze(['light' as ConsolidatorPhase]),
    ceilings: {
      maxTokensPerDay: 0,
      maxCostPerDay: 0,
      maxConcurrentRuns: 1,
      maxRunDurationMs: 5 * 60 * 1000,
      cooldownMs: 60_000,
    },
    onExceed: 'pause',
    cheapModel: null,
    deepModel: null,
    ingestGate: null,
    budgetResetSemantics: 'utc',
    noiseFilters: Object.freeze(['default' as const]),
    lockWaitMs: 30_000,
    decayTauDays: 7,
    decayArchiveThreshold: 0.05,
    decayCapacity: null,
    salienceWeights: DEFAULT_SALIENCE_WEIGHTS,
    maxStandardBatchSize: 50,
    maxTranscriptChars: 60_000,
    maxDeepConflictsPerRun: 20,
    dlqMaxRetries: 5,
    dlqBaseBackoffMs: 60_000,
    dlqMaxBackoffMs: 60 * 60 * 1000,
    formEpisodes: false,
    importanceScoring: false,
    autoPromoteExtraction: false,
    reflection: false,
    importanceThreshold: 3,
    reflectionMaxQuestions: 3,
    reflectionMaxQuarantinedInsights: 100,
    contextualRetrieval: 'late-chunk',
    learnedContext: false,
    learnedContextMaxChars: 1200,
    curatedBlocks: [],
    profileProjection: null,
    promotion: null,
  });

  const status = async (): Promise<ConsolidatorStatus> =>
    Object.freeze({
      tier,
      triggers,
      phases: config.phases,
      running,
      paused,
      pendingConflicts: 0,
      queueDepth: 0,
      dlqSize: 0,
      deferredRuns: 0,
      emptyExtractions: 0,
      lastRuns: Object.freeze({}),
      budget: {
        tokensUsedToday: 0,
        costUsedToday: 0,
        tokensRemaining: 0,
        costRemaining: 0,
        resetAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
      budgetRemaining: {
        tokens: 0,
        costUsd: 0,
      },
    });

  return {
    async start() {
      running = true;
    },
    async stop() {
      running = false;
    },
    async trigger() {
      return null;
    },
    async notifyActivity(): Promise<PhaseOutcome | null> {
      // Placeholder - no buffer trigger to evaluate.
      return null;
    },
    async fireNow(): Promise<PhaseOutcome | null> {
      return null;
    },
    async setTier(next: ConsolidatorTier) {
      tier = next;
    },
    async pause() {
      paused = true;
    },
    async resume() {
      paused = false;
    },
    recordExternalSpend(): void {
      // Placeholder - no budget to record against.
    },
    onPhaseFinished(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    config() {
      return config;
    },
    async registerWithScheduler() {
      // No-op consolidator: nothing to schedule.
      return Object.freeze({ registered: Object.freeze([]), skipped: Object.freeze([]) });
    },
    isFree() {
      return tier === 'free';
    },
    async drainDlq() {
      return 0;
    },
    status,
  };
}
