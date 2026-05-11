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
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';
import type { SemanticMemory } from '../tiers/semantic-memory.js';

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
  | `budget:${number}`;

/**
 * Tier preset that selects a consolidator behaviour bundle. The
 * `'free'` preset is the default per DEC-144 / ADR-038 — no LLM call
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
  readonly kind: 'turn' | 'idle' | 'cron' | 'event' | 'budget' | 'manual';
  readonly value?: string | number;
}

/**
 * Hard cost ceilings enforced atomically per UTC day. The default
 * ceiling shape per tier is captured in
 * {@link CONSOLIDATOR_TIER_DEFAULTS}.
 *
 * @stable
 */
export interface ConsolidatorCeilings {
  readonly maxTokensPerDay: number;
  readonly maxCostPerDay: number;
  readonly maxConcurrentRuns: number;
  readonly maxRunDurationMs: number;
  readonly cooldownMs: number;
}

/**
 * Behaviour applied by the budget enforcer when a ceiling is hit
 * mid-run. `'pause'` is the conservative default — the consolidator
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
  /** Cheap-model identifier used by the standard phase. `null` disables. */
  readonly cheapModel: string | null;
  /** Deep-model identifier used by the deep phase. `null` disables. */
  readonly deepModel: string | null;
  readonly budgetResetSemantics: 'utc' | 'local' | 'sliding-24h';
  readonly budgetAttribution: 'shared' | 'per-trigger';
  readonly noiseFilters: ReadonlyArray<'default' | 'minimal' | 'none'>;
  readonly lockWaitMs: number;
  readonly decayTauDays: number;
  readonly decayArchiveThreshold: number;
  readonly maxStandardBatchSize: number;
  readonly maxDeepConflictsPerRun: number;
  readonly dlqMaxRetries: number;
  readonly dlqBaseBackoffMs: number;
  readonly dlqMaxBackoffMs: number;
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
 * budgetRemaining, deferredRuns }` — extended with a few additional
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
  /** Spec alias — surfaces remaining-budget figures at the top level. */
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
   * Storage adapter — supplies the consolidator state, runs, DLQ,
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
   * Provider used by the standard + deep phases. Required when the
   * tier enables either phase; ignored when the active phases
   * collapse to `['light']`.
   */
  readonly provider?: Provider | null;
  readonly tracer?: Tracer;
  /** Override the wall clock — used by tests. */
  readonly now?: () => number;
  /** Random source for stable run ids — used by tests. */
  readonly randomId?: () => string;
  readonly triggers?: ReadonlyArray<ConsolidatorTriggerSpec>;
  readonly tier?: ConsolidatorTier;
  readonly phases?: ReadonlyArray<ConsolidatorPhase>;
  readonly ceilings?: Partial<ConsolidatorCeilings>;
  readonly onExceed?: OnBudgetExceed;
  readonly cheapModel?: string | null;
  readonly deepModel?: string | null;
  readonly budgetResetSemantics?: 'utc' | 'local' | 'sliding-24h';
  readonly budgetAttribution?: 'shared' | 'per-trigger';
  readonly noiseFilters?: ReadonlyArray<'default' | 'minimal' | 'none'>;
  readonly lockWaitMs?: number;
  readonly decayTauDays?: number;
  readonly decayArchiveThreshold?: number;
  readonly maxStandardBatchSize?: number;
  readonly maxDeepConflictsPerRun?: number;
  readonly dlqMaxRetries?: number;
  readonly dlqBaseBackoffMs?: number;
  readonly dlqMaxBackoffMs?: number;
  /** Default scope used by event triggers + the manual `fireNow` path. */
  readonly defaultScope?: SessionScope;
}

/**
 * Tier preset table. The defaults follow ADR-038 §4 — `'free'`
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
  },
});
