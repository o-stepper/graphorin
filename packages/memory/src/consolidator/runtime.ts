/**
 * Consolidator runtime — orchestrates the three phases, the lock,
 * the budget, the cursor, and the DLQ. The factory is the public
 * surface; the class lives below it as a private implementation
 * detail.
 *
 * The runtime is **library-mode** by default — it does not start a
 * background scheduler. Triggers are realised through manual
 * `trigger(...)` / `fireNow(...)` calls or by wiring a
 * `@graphorin/triggers` scheduler externally. Phase 14 (server)
 * starts the daemon scheduler in `beforeStart` and pipes turn / idle
 * / cron triggers into `Consolidator.trigger(...)` from there.
 *
 * @packageDocumentation
 */

import type { Provider, SessionScope, Tracer } from '@graphorin/core';
import { NOOP_TRACER } from '@graphorin/core';
import type {
  ConsolidatorMemoryStoreExt,
  MemoryStoreAdapter,
} from '../internal/storage-adapter.js';
import type { EpisodicMemory } from '../tiers/episodic-memory.js';
import type { SemanticMemory } from '../tiers/semantic-memory.js';
import { BudgetTracker } from './budget.js';
import { DEFAULT_SALIENCE_WEIGHTS } from './decay.js';
import { classifyError, describeError, nextBackoffMs } from './dlq.js';
import { CustomTierMisconfiguredError, ProviderNotConfiguredError } from './errors.js';
import { tipMessageId } from './idempotency.js';
import { LockManager } from './lock.js';
import type { NoiseFilterPreset } from './noise-filter.js';
import { runDeepPhase } from './phases/deep.js';
import { runLightPhase } from './phases/light.js';
import { runReflectionPass } from './phases/reflect.js';
import { runStandardPhase } from './phases/standard.js';
import {
  CONSOLIDATOR_TIER_DEFAULTS,
  type ConsolidatorConfig,
  type ConsolidatorLastRuns,
  type ConsolidatorPhase,
  type ConsolidatorStatus,
  type ConsolidatorTier,
  type ConsolidatorTriggerReason,
  type ConsolidatorTriggerSpec,
  type CreateConsolidatorOptions,
  type PhaseListener,
  type PhaseOutcome,
} from './types.js';

/**
 * Consolidator runtime surface returned by {@link createConsolidator}.
 * Compatible with the placeholder shape so the facade can swap the
 * implementation without breaking consumers.
 *
 * @stable
 */
export interface Consolidator {
  start(): Promise<void>;
  stop(): Promise<void>;
  trigger(reason: ConsolidatorTriggerReason, scope: SessionScope): Promise<PhaseOutcome | null>;
  status(): Promise<ConsolidatorStatus>;
  /**
   * Manual trigger for the requested phase. Skips phase gating + the
   * idle/cron scheduler so admins can flush the queue on demand.
   */
  fireNow(phase: ConsolidatorPhase, scope?: SessionScope): Promise<PhaseOutcome | null>;
  /** Replace the active tier — recomputes ceilings + phase set. */
  setTier(tier: ConsolidatorTier): Promise<void>;
  /** Pause the consolidator until the next budget reset. */
  pause(): Promise<void>;
  /** Resume after `pause()`. */
  resume(): Promise<void>;
  /** Subscribe to phase-finished notifications. Returns an unsubscribe. */
  onPhaseFinished(listener: PhaseListener): () => void;
  /** Active config — frozen snapshot. */
  config(): ConsolidatorConfig;
  /** True when `tier === 'free'`. */
  isFree(): boolean;
  /** Drain DLQ rows whose `nextRetryAt` <= now. */
  drainDlq(scope: SessionScope): Promise<number>;
}

/**
 * Build the runtime consolidator.
 *
 * @stable
 */
export function createConsolidator(opts: CreateConsolidatorOptions): Consolidator {
  return new ConsolidatorImpl(opts);
}

class ConsolidatorImpl implements Consolidator {
  readonly #semantic: SemanticMemory;
  readonly #episodic: EpisodicMemory | null;
  readonly #store: MemoryStoreAdapter;
  readonly #consolidatorStore: ConsolidatorMemoryStoreExt | null;
  readonly #tracer: Tracer;
  readonly #now: () => number;
  readonly #randomId: () => string;
  readonly #provider: Provider | null;
  readonly #defaultScope: SessionScope | null;
  readonly #listeners = new Set<PhaseListener>();
  readonly #lockManager: LockManager;
  readonly #budget: BudgetTracker;
  #config: ConsolidatorConfig;
  #running = false;
  #manuallyPaused = false;
  #deferredRuns = 0;
  /**
   * Bumped when the runtime cannot persist a deferred run to the
   * audit log (e.g., adapter omits the consolidator surface). The
   * `status()` reader merges this with the persisted count so
   * library-mode callers still observe the deferral.
   */
  #deferredRunsAdjustment = 0;
  #emptyExtractions = 0;

  constructor(opts: CreateConsolidatorOptions) {
    this.#semantic = opts.semantic;
    this.#episodic = opts.episodic ?? null;
    this.#store = opts.store;
    this.#consolidatorStore = this.#store.consolidator ?? null;
    this.#tracer = opts.tracer ?? NOOP_TRACER;
    this.#now = opts.now ?? Date.now;
    this.#randomId =
      opts.randomId ??
      ((): string => {
        const a = Math.floor(Math.random() * 1e9).toString(36);
        const b = Math.floor(Math.random() * 1e9).toString(36);
        return `cr_${a}${b}`;
      });
    this.#provider = opts.provider ?? null;
    this.#defaultScope = opts.defaultScope ?? null;

    this.#config = resolveConfig(opts);
    this.#lockManager = new LockManager({
      store: this.#consolidatorStore,
      waitMs: this.#config.lockWaitMs,
      maxRunDurationMs: this.#config.ceilings.maxRunDurationMs,
      now: this.#now,
      randomId: this.#randomId,
    });
    this.#budget = new BudgetTracker({
      maxTokensPerDay: this.#config.ceilings.maxTokensPerDay,
      maxCostPerDay: this.#config.ceilings.maxCostPerDay,
      onExceed: this.#config.onExceed,
      resetSemantics: this.#config.budgetResetSemantics,
      now: this.#now,
    });
  }

  async start(): Promise<void> {
    this.#running = true;
  }

  async stop(): Promise<void> {
    this.#running = false;
  }

  async pause(): Promise<void> {
    this.#manuallyPaused = true;
  }

  async resume(): Promise<void> {
    this.#manuallyPaused = false;
  }

  config(): ConsolidatorConfig {
    return this.#config;
  }

  isFree(): boolean {
    return this.#config.tier === 'free';
  }

  onPhaseFinished(listener: PhaseListener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  async setTier(tier: ConsolidatorTier): Promise<void> {
    const preset = CONSOLIDATOR_TIER_DEFAULTS[tier];
    if (preset === undefined) {
      throw new Error(`[graphorin/memory] unknown consolidator tier '${tier}'`);
    }
    if (tier === 'custom') {
      throw new Error(
        '[graphorin/memory] consolidator.setTier("custom") requires explicit ceilings — re-create the consolidator with `tier: "custom"` + `ceilings`.',
      );
    }
    this.#config = Object.freeze({
      ...this.#config,
      tier,
      phases: preset.phases,
      ceilings: preset.ceilings,
      onExceed: preset.onExceed,
      formEpisodes: preset.formEpisodes,
      importanceScoring: preset.importanceScoring,
      reflection: preset.reflection,
      importanceThreshold: preset.importanceThreshold,
      reflectionMaxQuestions: preset.reflectionMaxQuestions,
      contextualRetrieval: preset.contextualRetrieval,
    });
    this.#budget.reconfigure({
      maxTokensPerDay: preset.ceilings.maxTokensPerDay,
      maxCostPerDay: preset.ceilings.maxCostPerDay,
    });
  }

  async status(): Promise<ConsolidatorStatus> {
    let lastRunAt: string | undefined;
    let lastPhase: ConsolidatorPhase | undefined;
    const lastRuns: { -readonly [K in keyof ConsolidatorLastRuns]: ConsolidatorLastRuns[K] } = {};
    let pendingConflicts = 0;
    let dlqSize = 0;
    let deferredFromStore = 0;
    if (this.#consolidatorStore !== null && this.#defaultScope !== null) {
      const state = await this.#consolidatorStore.getState(this.#defaultScope);
      if (state !== null) {
        if (state.lastCompletedAt !== null) {
          lastRunAt = new Date(state.lastCompletedAt).toISOString();
        }
        if (state.lastPhase !== null) {
          lastPhase = state.lastPhase;
        }
      }
      const failed = await this.#consolidatorStore.listFailedBatches(this.#defaultScope, 1000);
      dlqSize = failed.length;
      // Hydrate per-phase `lastRuns` and the persisted deferred_runs
      // counter from the run audit log so process restart preserves
      // both surfaces.
      const recent = await this.#consolidatorStore.listRecentRuns(this.#defaultScope, 500);
      for (const run of recent) {
        if (run.status === 'deferred') {
          deferredFromStore += 1;
          continue;
        }
        if (run.status !== 'completed' && run.status !== 'partial') continue;
        const stamp = new Date(run.finishedAt ?? run.startedAt).toISOString();
        if (run.phase === 'light' && lastRuns.light === undefined) lastRuns.light = stamp;
        else if (run.phase === 'standard' && lastRuns.standard === undefined)
          lastRuns.standard = stamp;
        else if (run.phase === 'deep' && lastRuns.deep === undefined) lastRuns.deep = stamp;
      }
    }
    if (this.#store.conflicts !== undefined && this.#defaultScope !== null) {
      const list = await this.#store.conflicts.listPending(this.#defaultScope, 1000);
      pendingConflicts = list.length;
    }
    const snapshot = this.#budget.snapshot();
    const persistedDeferred = deferredFromStore + this.#deferredRunsAdjustment;
    const totalDeferred = Math.max(persistedDeferred, this.#deferredRuns);
    const out: ConsolidatorStatus = {
      tier: this.#config.tier,
      triggers: this.#config.triggers,
      phases: this.#config.phases,
      running: this.#running,
      paused: this.#manuallyPaused || snapshot.paused,
      pendingConflicts,
      queueDepth: pendingConflicts,
      dlqSize,
      deferredRuns: totalDeferred,
      emptyExtractions: this.#emptyExtractions,
      lastRuns: Object.freeze(lastRuns),
      budget: {
        tokensUsedToday: snapshot.tokensUsedToday,
        costUsedToday: snapshot.costUsedToday,
        tokensRemaining: snapshot.tokensRemaining,
        costRemaining: snapshot.costRemaining,
        resetAt: snapshot.resetAt,
      },
      budgetRemaining: {
        tokens: snapshot.tokensRemaining,
        costUsd: snapshot.costRemaining,
      },
      ...(lastRunAt !== undefined ? { lastRunAt } : {}),
      ...(lastPhase !== undefined ? { lastPhase } : {}),
    };
    return out;
  }

  async trigger(
    reason: ConsolidatorTriggerReason,
    scope: SessionScope,
  ): Promise<PhaseOutcome | null> {
    if (!this.#running) return null;
    if (this.#manuallyPaused) return null;
    const phases = this.#planPhases(reason);
    if (phases.length === 0) return null;
    let last: PhaseOutcome | null = null;
    for (const phase of phases) {
      last = await this.#runPhase(phase, scope, reason);
      if (last?.status === 'failed' || last?.status === 'deferred') break;
    }
    return last;
  }

  async fireNow(phase: ConsolidatorPhase, scope?: SessionScope): Promise<PhaseOutcome | null> {
    const target = scope ?? this.#defaultScope;
    if (target === null) {
      throw new Error(
        '[graphorin/memory] consolidator.fireNow requires a scope (default scope was not configured).',
      );
    }
    if (!this.#config.phases.includes(phase) && phase !== 'light') {
      // Allow manual flushes regardless of phase gating; warn through INFO.
    }
    return this.#runPhase(phase, target, { kind: 'manual', value: phase });
  }

  async drainDlq(scope: SessionScope): Promise<number> {
    const store = this.#consolidatorStore;
    if (store === null) return 0;
    const ready = await store.claimReadyBatches(scope, this.#now(), 50);
    let drained = 0;
    for (const row of ready) {
      const replayPhase = inferReplayPhase(row.errorKind);
      let succeeded = false;
      let lastError: unknown = null;
      try {
        const outcome = await this.#dispatch(replayPhase, scope);
        if (outcome.status === 'completed' || outcome.status === 'partial') {
          succeeded = true;
        } else if (outcome.errorMessage !== null) {
          lastError = new Error(outcome.errorMessage);
        }
      } catch (err) {
        lastError = err;
      }
      if (succeeded) {
        await store.markBatchSucceeded(row.id);
        drained += 1;
        continue;
      }
      const nextRetryCount = row.retryCount + 1;
      if (nextRetryCount >= this.#config.dlqMaxRetries) {
        await store.markBatchExhausted(row.id, describeError(lastError), nextRetryCount);
      } else {
        const delayMs = nextBackoffMs({
          retryCount: nextRetryCount,
          baseMs: this.#config.dlqBaseBackoffMs,
          maxMs: this.#config.dlqMaxBackoffMs,
        });
        await store.rescheduleBatch(row.id, nextRetryCount, this.#now() + delayMs);
      }
    }
    return drained;
  }

  // ---------------------------------------------------------------------------

  #planPhases(reason: ConsolidatorTriggerReason): ConsolidatorPhase[] {
    const enabled = new Set(this.#config.phases);
    const planned: ConsolidatorPhase[] = [];
    if (reason.kind === 'turn' || reason.kind === 'idle' || reason.kind === 'event') {
      if (enabled.has('light')) planned.push('light');
      if (enabled.has('standard')) planned.push('standard');
    } else if (reason.kind === 'cron' || reason.kind === 'manual' || reason.kind === 'budget') {
      if (enabled.has('light')) planned.push('light');
      if (enabled.has('standard')) planned.push('standard');
      if (enabled.has('deep')) planned.push('deep');
    }
    return planned;
  }

  async #runPhase(
    phase: ConsolidatorPhase,
    scope: SessionScope,
    reason: ConsolidatorTriggerReason,
  ): Promise<PhaseOutcome | null> {
    const precheck = this.#budget.precheck(phase);
    if (!precheck.allowed && phase !== 'light') {
      return this.#emit(
        { ...skipOutcome(phase, precheck.reason ?? 'paused'), phase },
        scope,
        reason,
      );
    }
    const acquisition = await this.#lockManager.acquire(scope);
    if (acquisition.kind === 'deferred') {
      this.#deferredRuns += 1;
      const deferredRunId = this.#randomId();
      const deferredAt = this.#now();
      // Persist the deferral as a `consolidator_runs` row so the
      // counter survives process restart (DEC-150 — same code path
      // lib + server). Adapters that do not expose the consolidator
      // surface fall through to the in-memory adjustment counter.
      if (this.#consolidatorStore !== null) {
        try {
          await this.#consolidatorStore.recordRunStart({
            id: deferredRunId,
            scope,
            triggerKind: reason.kind,
            phase,
            startedAt: deferredAt,
          });
          await this.#consolidatorStore.recordRunFinish({
            id: deferredRunId,
            finishedAt: deferredAt,
            status: 'deferred',
            errorMessage: `lock held by ${acquisition.heldBy ?? 'unknown'}`,
          });
        } catch {
          this.#deferredRunsAdjustment += 1;
        }
      } else {
        this.#deferredRunsAdjustment += 1;
      }
      return this.#emit(
        {
          phase,
          status: 'deferred',
          factsCreated: 0,
          factsUpdated: 0,
          conflictsResolved: 0,
          episodesFormed: 0,
          insightsCreated: 0,
          noiseFilteredCount: 0,
          emptyExtractions: 0,
          llmTokensUsed: 0,
          llmCostUsd: null,
          errorMessage: `lock held by ${acquisition.heldBy ?? 'unknown'}`,
        },
        scope,
        reason,
      );
    }
    const runId = acquisition.runId;
    const startedAt = this.#now();
    if (this.#consolidatorStore !== null) {
      await this.#consolidatorStore.recordRunStart({
        id: runId,
        scope,
        triggerKind: reason.kind,
        phase,
        startedAt,
      });
    }
    let outcome: PhaseOutcome;
    try {
      outcome = await this.#dispatch(phase, scope);
    } catch (err) {
      outcome = {
        phase,
        status: 'failed',
        factsCreated: 0,
        factsUpdated: 0,
        conflictsResolved: 0,
        episodesFormed: 0,
        insightsCreated: 0,
        noiseFilteredCount: 0,
        emptyExtractions: 0,
        llmTokensUsed: 0,
        llmCostUsd: null,
        errorMessage: describeError(err),
      };
      if (this.#consolidatorStore !== null) {
        await this.#consolidatorStore.enqueueFailedBatch({
          id: this.#randomId(),
          consolidatorRunId: runId,
          scope,
          messageIds: [],
          errorKind: classifyError(err),
          errorMessage: describeError(err),
          failedAt: this.#now(),
          nextRetryAt:
            this.#now() +
            nextBackoffMs({
              retryCount: 0,
              baseMs: this.#config.dlqBaseBackoffMs,
              maxMs: this.#config.dlqMaxBackoffMs,
            }),
          retryCount: 0,
        });
      }
    }
    if (outcome.emptyExtractions > 0) {
      this.#emptyExtractions += outcome.emptyExtractions;
    }
    if (this.#consolidatorStore !== null) {
      await this.#consolidatorStore.recordRunFinish({
        id: runId,
        finishedAt: this.#now(),
        status: outcome.status,
        llmTokensUsed: outcome.llmTokensUsed,
        llmCostUsd: outcome.llmCostUsd,
        factsCreated: outcome.factsCreated,
        factsUpdated: outcome.factsUpdated,
        conflictsResolved: outcome.conflictsResolved,
        noiseFilteredCount: outcome.noiseFilteredCount,
        emptyExtractions: outcome.emptyExtractions,
        errorMessage: outcome.errorMessage,
      });
      await this.#consolidatorStore.upsertState(scope, {
        lastPhase: phase,
        lastCompletedAt: this.#now(),
        nextEligibleAt: this.#now() + this.#config.ceilings.cooldownMs,
      });
    }
    await this.#lockManager.release(scope, runId);
    return this.#emit(outcome, scope, reason);
  }

  async #dispatch(phase: ConsolidatorPhase, scope: SessionScope): Promise<PhaseOutcome> {
    const state =
      this.#consolidatorStore !== null ? await this.#consolidatorStore.getState(scope) : null;
    const lastProcessedMessageId = state?.lastProcessedMessageId ?? null;
    if (phase === 'light') {
      const out = await runLightPhase({
        store: this.#store,
        consolidatorStore: this.#consolidatorStore,
        tracer: this.#tracer,
        scope,
        now: this.#now,
        decayTauDays: this.#config.decayTauDays,
        decayArchiveThreshold: this.#config.decayArchiveThreshold,
        decayCapacity: this.#config.decayCapacity,
        salienceWeights: this.#config.salienceWeights,
        noiseFilters: this.#config.noiseFilters as ReadonlyArray<NoiseFilterPreset>,
        maxBatchSize: this.#config.maxStandardBatchSize,
        lastProcessedMessageId,
        tier: this.#config.tier,
      });
      return out;
    }
    if (phase === 'standard') {
      if (this.#provider === null) {
        throw new ProviderNotConfiguredError('standard');
      }
      const session = this.#store.session;
      const rawBatch =
        typeof session.listMessagesSince === 'function'
          ? await session.listMessagesSince(
              scope,
              lastProcessedMessageId,
              this.#config.maxStandardBatchSize,
            )
          : [];
      const out = await runStandardPhase({
        semantic: this.#semantic,
        episodic: this.#episodic,
        formEpisodes: this.#config.formEpisodes,
        importanceScoring: this.#config.importanceScoring,
        contextualRetrieval: this.#config.contextualRetrieval,
        store: this.#store,
        consolidatorStore: this.#consolidatorStore,
        provider: this.#provider,
        tracer: this.#tracer,
        scope,
        cheapModel: this.#config.cheapModel,
        noiseFilters: this.#config.noiseFilters as ReadonlyArray<NoiseFilterPreset>,
        maxBatchSize: this.#config.maxStandardBatchSize,
        lastProcessedMessageId,
        budget: this.#budget,
        tier: this.#config.tier === 'free' ? 'cheap' : this.#config.tier,
        now: this.#now,
        batch: rawBatch,
      });
      const cursor = tipMessageId(rawBatch);
      if (cursor !== null && this.#consolidatorStore !== null) {
        await this.#consolidatorStore.upsertState(scope, {
          lastProcessedMessageId: cursor,
        });
      }
      return out;
    }
    if (this.#provider === null) {
      throw new ProviderNotConfiguredError('deep');
    }
    const deepOut = await runDeepPhase({
      store: this.#store,
      consolidatorStore: this.#consolidatorStore,
      provider: this.#provider,
      tracer: this.#tracer,
      scope,
      deepModel: this.#config.deepModel,
      maxConflictsPerRun: this.#config.maxDeepConflictsPerRun,
      budget: this.#budget,
      tier:
        this.#config.tier === 'free' || this.#config.tier === 'cheap'
          ? 'standard'
          : this.#config.tier,
      now: this.#now,
    });
    // Reflection pass (P1-1) runs after the conflict drain, reusing the
    // deep run's lock + budget + audit window. Triple-gated: enabled by
    // config, an episodic tier present (importance source), and an
    // insight-capable storage adapter. The accumulated-importance
    // threshold is enforced inside the pass.
    const insightStore = this.#store.insights;
    if (this.#config.reflection && this.#episodic !== null && insightStore !== undefined) {
      // MCON-13: read the persisted reflection watermark so the gate only
      // accumulates importance from episodes newer than the last pass, and
      // persist the advanced value afterwards (a no-op when unchanged).
      const priorWatermark =
        this.#consolidatorStore !== null
          ? ((await this.#consolidatorStore.getState(scope))?.reflectionWatermark ?? null)
          : null;
      const reflection = await runReflectionPass({
        provider: this.#provider,
        tracer: this.#tracer,
        scope,
        semantic: this.#semantic,
        episodic: this.#episodic,
        insights: insightStore,
        budget: this.#budget,
        importanceThreshold: this.#config.importanceThreshold,
        reflectionWatermark: priorWatermark,
        maxQuestions: this.#config.reflectionMaxQuestions,
        now: this.#now,
      });
      if (this.#consolidatorStore !== null && reflection.nextWatermark !== priorWatermark) {
        await this.#consolidatorStore.upsertState(scope, {
          reflectionWatermark: reflection.nextWatermark,
        });
      }
      return {
        ...deepOut,
        insightsCreated: reflection.insightsCreated,
        llmTokensUsed: deepOut.llmTokensUsed + reflection.tokens,
        llmCostUsd:
          deepOut.llmCostUsd === null && reflection.costUsd === 0
            ? null
            : (deepOut.llmCostUsd ?? 0) + reflection.costUsd,
      };
    }
    return deepOut;
  }

  #emit(
    outcome: PhaseOutcome,
    scope: SessionScope,
    reason: ConsolidatorTriggerReason,
  ): PhaseOutcome {
    for (const listener of this.#listeners) {
      try {
        listener({ ...outcome, scope, trigger: reason });
      } catch {
        // Listeners must never break the runtime.
      }
    }
    return outcome;
  }
}

function skipOutcome(
  phase: ConsolidatorPhase,
  reason: 'tokens-exceeded' | 'cost-exceeded' | 'paused',
): PhaseOutcome {
  return {
    phase,
    status: 'deferred',
    factsCreated: 0,
    factsUpdated: 0,
    conflictsResolved: 0,
    episodesFormed: 0,
    insightsCreated: 0,
    noiseFilteredCount: 0,
    emptyExtractions: 0,
    llmTokensUsed: 0,
    llmCostUsd: null,
    errorMessage: `phase skipped — ${reason}`,
  };
}

/** Resolve operator-supplied options into a fully-defaulted config. */
function resolveConfig(opts: CreateConsolidatorOptions): ConsolidatorConfig {
  const tier: ConsolidatorTier = opts.tier ?? 'free';
  const preset = CONSOLIDATOR_TIER_DEFAULTS[tier];
  if (preset === undefined) {
    throw new Error(`[graphorin/memory] unknown consolidator tier '${tier}'`);
  }
  const ceilings = {
    ...preset.ceilings,
    ...(opts.ceilings ?? {}),
  };
  const phases = opts.phases ?? preset.phases;
  if (tier === 'custom') {
    const missing: string[] = [];
    if (ceilings.maxTokensPerDay <= 0) missing.push('ceilings.maxTokensPerDay');
    if (ceilings.maxCostPerDay <= 0) missing.push('ceilings.maxCostPerDay');
    if (phases.length === 0) missing.push('phases');
    if (missing.length > 0) {
      throw new CustomTierMisconfiguredError(missing);
    }
  }
  return Object.freeze({
    triggers: Object.freeze([...(opts.triggers ?? defaultTriggers())] as ConsolidatorTriggerSpec[]),
    tier,
    phases: Object.freeze([...phases]) as ReadonlyArray<ConsolidatorPhase>,
    ceilings,
    onExceed: opts.onExceed ?? preset.onExceed,
    cheapModel: opts.cheapModel ?? preset.cheapModel,
    deepModel: opts.deepModel ?? preset.deepModel,
    budgetResetSemantics: opts.budgetResetSemantics ?? 'utc',
    budgetAttribution: opts.budgetAttribution ?? 'shared',
    noiseFilters: Object.freeze([...(opts.noiseFilters ?? ['default'])]),
    lockWaitMs: opts.lockWaitMs ?? 30_000,
    decayTauDays: opts.decayTauDays ?? 7,
    decayArchiveThreshold: opts.decayArchiveThreshold ?? 0.05,
    decayCapacity: opts.decayCapacity ?? null,
    salienceWeights: opts.salienceWeights ?? DEFAULT_SALIENCE_WEIGHTS,
    maxStandardBatchSize: opts.maxStandardBatchSize ?? 50,
    maxDeepConflictsPerRun: opts.maxDeepConflictsPerRun ?? 20,
    dlqMaxRetries: opts.dlqMaxRetries ?? 5,
    dlqBaseBackoffMs: opts.dlqBaseBackoffMs ?? 60_000,
    dlqMaxBackoffMs: opts.dlqMaxBackoffMs ?? 60 * 60 * 1000,
    formEpisodes: opts.formEpisodes ?? preset.formEpisodes,
    importanceScoring: opts.importanceScoring ?? preset.importanceScoring,
    reflection: opts.reflection ?? preset.reflection,
    importanceThreshold: opts.importanceThreshold ?? preset.importanceThreshold,
    reflectionMaxQuestions: opts.reflectionMaxQuestions ?? preset.reflectionMaxQuestions,
    contextualRetrieval: opts.contextualRetrieval ?? preset.contextualRetrieval,
  });
}

function defaultTriggers(): ConsolidatorTriggerSpec[] {
  return ['turn:20', 'idle:5m'];
}

/**
 * Infer which phase to replay when a DLQ row is claimed. Standard
 * phase is the default — the rate-limit / 5xx / timeout / parse
 * errors all originate in standard-phase LLM calls. The deep-phase
 * judge can also fail, but those errors land in the DLQ with a
 * different `error_kind` only when the runtime tags them
 * explicitly; for now the heuristic is good enough.
 *
 * @internal
 */
function inferReplayPhase(errorKind: string): ConsolidatorPhase {
  void errorKind;
  return 'standard';
}
