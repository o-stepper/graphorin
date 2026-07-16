/**
 * Consolidator runtime - orchestrates the three phases, the lock,
 * the budget, the cursor, and the DLQ. The factory is the public
 * surface; the class lives below it as a private implementation
 * detail.
 *
 * The runtime is **library-mode** by default - it does not start a
 * background scheduler. Cron / idle triggers are realised by
 * registering them with a `@graphorin/triggers` scheduler via
 * `registerWithScheduler(...)` (the standalone server calls this in
 * `beforeStart` whenever a consolidator + a triggers scheduler are both
 * supplied). Turn / event triggers are consumer-emitted - the scheduler
 * cannot fire them on its own, so the consumer must call
 * `trigger({ kind: 'turn' | 'event' }, ...)` from its own loop. Manual
 * `trigger(...)` / `fireNow(...)` calls work in either mode.
 *
 * @packageDocumentation
 */

import type { Provider, SessionScope, Tracer } from '@graphorin/core';
import { NOOP_TRACER } from '@graphorin/core';
import { withMemorySpan } from '../internal/spans.js';
import type {
  ConsolidatorMemoryStoreExt,
  DlqBatchRow,
  MemoryStoreAdapter,
} from '../internal/storage-adapter.js';
import type { EpisodicMemory } from '../tiers/episodic-memory.js';
import type { SemanticMemory } from '../tiers/semantic-memory.js';
import type { WorkingMemory } from '../tiers/working-memory.js';
import { BudgetTracker } from './budget.js';
import { DEFAULT_SALIENCE_WEIGHTS } from './decay.js';
import { classifyError, describeError, nextBackoffMs } from './dlq.js';
import {
  CuratedBlocksMisconfiguredError,
  CustomTierMisconfiguredError,
  ProviderNotConfiguredError,
} from './errors.js';
import { tipMessageId } from './idempotency.js';
import { LockManager, scopeKey } from './lock.js';
import type { NoiseFilterPreset } from './noise-filter.js';
import { runDeepPhase } from './phases/deep.js';
import {
  LEARNED_CONTEXT_BLOCK_LABEL,
  type ResolvedCuratedBlock,
  runCuratedBlockPass,
} from './phases/learned-context.js';
import { runLightPhase } from './phases/light.js';
import {
  PROFILE_BLOCK_LABEL,
  resolveProfileProjectionConfig,
  runProfileProjectionPass,
} from './phases/profile-projection.js';
import { runReflectionPass } from './phases/reflect.js';
import { renderTranscript, runStandardPhase } from './phases/standard.js';
import {
  type ResolvedPromotionPolicy,
  resolvePromotionPolicy,
  shouldPromote,
} from './promotion.js';
import {
  type RegisterTriggersResult,
  registerConsolidatorTriggers,
  type SchedulerLike,
} from './scheduler.js';
import { parseTriggerSpec } from './triggers.js';
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
 * Age after which an unresolved CONFLICT-CHECK row is expired as
 * `'admit'` at tiers with no deep phase (memory-consolidation-04) -
 * the judge that would resolve it never runs there.
 */
const PENDING_CONFLICT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
  /** Replace the active tier - recomputes ceilings + phase set. */
  setTier(tier: ConsolidatorTier): Promise<void>;
  /** Pause the consolidator until the next budget reset. */
  pause(): Promise<void>;
  /** Resume after `pause()`. */
  resume(): Promise<void>;
  /** Subscribe to phase-finished notifications. Returns an unsubscribe. */
  onPhaseFinished(listener: PhaseListener): () => void;
  /**
   * Record memory-pipeline LLM spend that happened OUTSIDE a phase run
   * (MCON-15 - e.g. workflow induction) so the daily ceilings cover it.
   * Counted under the deep-phase bucket.
   */
  recordExternalSpend(tokens: number, costUsd?: number): void;
  /** Active config - frozen snapshot. */
  config(): ConsolidatorConfig;
  /**
   * Register this consolidator's cron / idle triggers with a
   * `@graphorin/triggers` scheduler so they fire `trigger(...)`
   * automatically (the daemon ↔ triggers bridge - MCON-4). Uses the
   * configured `defaultScope`; throws if none was set. Turn / event
   * triggers are skipped (consumer-emitted). The standalone server calls
   * this in `beforeStart`.
   */
  registerWithScheduler(scheduler: SchedulerLike): Promise<RegisterTriggersResult>;
  /** True when `tier === 'free'`. */
  isFree(): boolean;
  /** Drain DLQ rows whose `nextRetryAt` <= now. */
  drainDlq(scope: SessionScope): Promise<number>;
  /**
   * Activity signal from the embedding runtime (item 7, A2): a turn
   * finished / the transcript grew. Re-evaluates the `buffer:N`
   * trigger - when the unconsolidated transcript tail (from the
   * standard-phase cursor) reaches the configured token threshold
   * (chars/4 proxy, the same measure as the W-081 transcript budget),
   * the light+standard chain fires with reason `{ kind: 'buffer' }`.
   * The documented contract is "buffer:N OR idle:T": whichever comes
   * first consolidates the settled segment, and the MCON-8 cooldown
   * still applies so message bursts cannot storm the pipeline. No-op
   * when no `buffer:N` trigger is configured, when the consolidator
   * is stopped/paused, or when no scope is resolvable. The server
   * calls this from its run tracker; library-mode callers invoke it
   * from their own loop next to `scheduler.recordActivity()`.
   */
  notifyActivity(scope?: SessionScope): Promise<PhaseOutcome | null>;
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
  readonly #working: WorkingMemory | null;
  readonly #store: MemoryStoreAdapter;
  readonly #consolidatorStore: ConsolidatorMemoryStoreExt | null;
  readonly #tracer: Tracer;
  readonly #now: () => number;
  readonly #randomId: () => string;
  readonly #provider: Provider | null;
  /** Per-phase provider overrides (MCON-7); fall back to `#provider`. */
  readonly #cheapProvider: Provider | null;
  readonly #deepProvider: Provider | null;
  /**
   * USD pricer for phase LLM usage (memory-consolidation-02). Without
   * it every phase's `priceUsage?.(...) ?? 0` evaluates to zero and the
   * `maxCostPerDay` ceiling can never trip.
   */
  readonly #priceUsage:
    | ((usage: { promptTokens: number; completionTokens: number }) => number)
    | null;
  readonly #defaultScope: SessionScope | null;
  readonly #listeners = new Set<PhaseListener>();
  readonly #lockManager: LockManager;
  readonly #budget: BudgetTracker;
  #config: ConsolidatorConfig;
  #running = false;
  #manuallyPaused = false;
  #deferredRuns = 0;
  /**
   * Message ids of the batch the in-flight `#dispatch` operates on,
   * keyed by {@link scopeKey} (MCON-10, W-142). Captured so a thrown
   * phase can enqueue its DLQ row with the REAL failed slice instead of
   * `[]` - replays must target the window that failed, not whatever the
   * cursor points at later. Keyed per scope because the lock is
   * per-scope: two scopes may run standard phases concurrently in one
   * process, and a single instance field would let scope B overwrite
   * the slice scope A is about to fail on. The per-scope lock bounds
   * this map to one live entry per scope; entries are removed in the
   * dispatch `finally`.
   */
  readonly #dispatchMessageIdsByScope = new Map<string, ReadonlyArray<string>>();
  /**
   * Bumped when the runtime cannot persist a deferred run to the
   * audit log (e.g., adapter omits the consolidator surface). The
   * `status()` reader merges this with the persisted count so
   * library-mode callers still observe the deferral.
   */
  #deferredRunsAdjustment = 0;
  #emptyExtractions = 0;
  /**
   * Smallest configured `buffer:N` threshold (tokens, chars/4 proxy),
   * parsed once at construction. `null` = no buffer trigger declared,
   * `notifyActivity(...)` is a no-op (item 7, A2).
   */
  readonly #bufferThresholdTokens: number | null;

  constructor(opts: CreateConsolidatorOptions) {
    this.#semantic = opts.semantic;
    this.#episodic = opts.episodic ?? null;
    this.#working = opts.working ?? null;
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
    this.#cheapProvider = opts.cheapProvider ?? null;
    this.#deepProvider = opts.deepProvider ?? null;
    this.#priceUsage = opts.priceUsage ?? null;
    this.#defaultScope = opts.defaultScope ?? null;

    this.#config = resolveConfig(opts);
    this.#bufferThresholdTokens = minBufferThreshold(this.#config.triggers);
    // BUFFER-N-01: registerConsolidatorTriggers throws on a malformed spec, but
    // a library-mode (buffer-only) deployment never calls it - createMemory
    // would otherwise accept e.g. 'buffer:0' silently and leave notifyActivity()
    // inert forever. Surface each unparseable spec as a one-shot construction
    // WARN so the operator learns the loop it configured will never fire.
    warnInvalidTriggerSpecs(this.#config.triggers);
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

  async registerWithScheduler(scheduler: SchedulerLike): Promise<RegisterTriggersResult> {
    if (this.#defaultScope === null) {
      throw new Error(
        '[graphorin/memory] Consolidator.registerWithScheduler requires a defaultScope. ' +
          'Pass `defaultScope` to createConsolidator / createMemory, or call ' +
          'registerConsolidatorTriggers(consolidator, scheduler, { scope }) directly.',
      );
    }
    return registerConsolidatorTriggers(this, scheduler, { scope: this.#defaultScope });
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

  recordExternalSpend(tokens: number, costUsd?: number): void {
    if (!Number.isFinite(tokens) || tokens <= 0) return;
    this.#budget.record({ phase: 'deep', tokens, costUsd: costUsd ?? 0 });
  }

  async setTier(tier: ConsolidatorTier): Promise<void> {
    const preset = CONSOLIDATOR_TIER_DEFAULTS[tier];
    if (preset === undefined) {
      throw new Error(`[graphorin/memory] unknown consolidator tier '${tier}'`);
    }
    if (tier === 'custom') {
      throw new Error(
        '[graphorin/memory] consolidator.setTier("custom") requires explicit ceilings - re-create the consolidator with `tier: "custom"` + `ceilings`.',
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
      reflectionMaxQuarantinedInsights: preset.reflectionMaxQuarantinedInsights,
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
    // memory-consolidation-03: `drainDlq` finally has a production
    // caller - failed batches whose backoff has elapsed replay here
    // instead of accumulating forever. Cheap when the queue is empty
    // (one SELECT); replays are backoff-gated by the store.
    await this.drainDlq(scope).catch(() => 0);
    // memory-consolidation-04: tiers without a deep phase never drain
    // the pending CONFLICT-CHECK queue - expire stale rows as 'admit'
    // so it cannot grow monotonically at the free/cheap defaults.
    await this.#expireStalePendingConflicts(scope).catch(() => {});
    const phases = this.#planPhases(reason);
    if (phases.length === 0) return null;
    // MCON-8: enforce the cooldown the runtime always PERSISTED but never
    // read - back-to-back triggers used to fire with zero quiet period.
    // Checked ONCE per trigger dispatch (phases within one dispatch chain
    // freely); manual fireNow(...) / DLQ replays bypass it.
    if (reason.kind !== 'manual' && this.#config.ceilings.cooldownMs > 0) {
      const state =
        this.#consolidatorStore !== null ? await this.#consolidatorStore.getState(scope) : null;
      const eligibleAt = state?.nextEligibleAt ?? null;
      const firstPhase = phases[0] ?? 'light';
      if (eligibleAt !== null && this.#now() < eligibleAt) {
        return this.#emit(
          { ...skipOutcome(firstPhase, 'cooldown'), phase: firstPhase },
          scope,
          reason,
        );
      }
    }
    let last: PhaseOutcome | null = null;
    for (const phase of phases) {
      last = await this.#runPhase(phase, scope, reason);
      if (last?.status === 'failed' || last?.status === 'deferred') break;
    }
    return last;
  }

  async notifyActivity(scope?: SessionScope): Promise<PhaseOutcome | null> {
    if (!this.#running || this.#manuallyPaused) return null;
    const target = scope ?? this.#defaultScope;
    if (target === null) return null;
    const threshold = this.#bufferThresholdTokens;
    if (threshold === null) return null;
    const session = this.#store.session;
    if (typeof session.listMessagesSince !== 'function') return null;
    const state =
      this.#consolidatorStore !== null ? await this.#consolidatorStore.getState(target) : null;
    const cursor = state?.lastProcessedMessageId ?? null;
    // The measured tail is bounded by one standard batch: a tail that
    // large clears any reasonable threshold anyway, and an undercount
    // only delays the fire until the `idle:T` leg of the
    // "buffer:N OR idle:T" contract catches the segment.
    const tail = await session.listMessagesSince(target, cursor, this.#config.maxStandardBatchSize);
    if (tail.length === 0) return null;
    // Same chars/4 token proxy as the W-081 transcript budget, over the
    // same rendering the standard phase consumes - the threshold and
    // the budget speak identical units.
    const tokens = Math.ceil(renderTranscript(tail).length / 4);
    if (tokens < threshold) return null;
    return this.trigger({ kind: 'buffer', value: threshold }, target);
  }

  async fireNow(phase: ConsolidatorPhase, scope?: SessionScope): Promise<PhaseOutcome | null> {
    const target = scope ?? this.#defaultScope;
    if (target === null) {
      throw new Error(
        '[graphorin/memory] consolidator.fireNow requires a scope (default scope was not configured).',
      );
    }
    if (!this.#config.phases.includes(phase) && phase !== 'light') {
      // MCON-17: manual flushes bypass phase gating ON PURPOSE - but the
      // operator should know they are running a phase the tier disabled
      // (the old empty branch promised a warn and emitted nothing).
      process.stderr.write(
        `[graphorin/memory] consolidator.fireNow('${phase}') runs a phase not enabled for tier '${this.#config.tier}' - proceeding (manual flushes bypass phase gating).\n`,
      );
    }
    return this.#runPhase(phase, target, { kind: 'manual', value: phase });
  }

  /**
   * memory-consolidation-04: at tiers with no deep phase the pending
   * CONFLICT-CHECK queue has no drain. Resolve rows older than 7 days
   * as `'admit'` (the safe direction - the candidate fact stays live;
   * only the never-coming judge call is skipped), bounded per sweep.
   */
  async #expireStalePendingConflicts(scope: SessionScope): Promise<void> {
    if (this.#config.phases.includes('deep')) return;
    const conflicts = this.#store.conflicts;
    if (conflicts === undefined) return;
    const cutoff = this.#now() - PENDING_CONFLICT_TTL_MS;
    const pending = await conflicts.listPending(scope, 200);
    for (const row of pending) {
      if (row.enqueuedAt <= cutoff) {
        await conflicts.markResolved(row.id, 'admit');
      }
    }
  }

  async drainDlq(scope: SessionScope): Promise<number> {
    const store = this.#consolidatorStore;
    if (store === null) return 0;
    const ready = await store.claimReadyBatches(scope, this.#now(), 50);
    let drained = 0;
    for (const row of ready) {
      // MCON-10: replay the phase that actually failed (persisted at
      // enqueue); legacy rows without one fall back to 'standard',
      // matching the old behaviour.
      const replayPhase: ConsolidatorPhase = row.phase ?? 'standard';
      let succeeded = false;
      let deferred = false;
      let lastError: unknown = null;
      try {
        // MCON-10: replays run through the FULL phase envelope - budget
        // precheck, scope lock, and recordRunStart/Finish - so they are
        // visible in `consolidator_runs` and cannot race a live run or
        // spend past a pause.
        const outcome = await this.#runPhase(replayPhase, scope, {
          kind: 'manual',
          value: `dlq-replay:${replayPhase}`,
        });
        if (outcome?.status === 'completed' || outcome?.status === 'partial') {
          succeeded = true;
        } else if (outcome?.status === 'deferred') {
          deferred = true;
          lastError = new Error(outcome.errorMessage ?? 'replay deferred');
        } else if (outcome?.errorMessage != null) {
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
      if (deferred) {
        // Lock contention / budget pause is transient - reschedule at the
        // SAME retry count so contention cannot exhaust the row.
        const delayMs = nextBackoffMs({
          retryCount: row.retryCount + 1,
          baseMs: this.#config.dlqBaseBackoffMs,
          maxMs: this.#config.dlqMaxBackoffMs,
        });
        await store.rescheduleBatch(row.id, row.retryCount, this.#now() + delayMs);
        continue;
      }
      const nextRetryCount = row.retryCount + 1;
      if (nextRetryCount >= this.#config.dlqMaxRetries) {
        await store.markBatchExhausted(row.id, describeError(lastError), nextRetryCount);
        await this.#skipPoisonSlice(scope, row, replayPhase);
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

  /**
   * W-081: poison-slice skip. When a standard-phase batch exhausts its
   * DLQ retries while the cursor still points before / inside the failed
   * window, every future trigger re-reads the SAME slice, fails the same
   * way and consolidation for the scope stalls forever (each drain also
   * used to mint a fresh DLQ row for the identical window). Force-advance
   * the cursor past the window instead: losing the poison slice's facts
   * is deliberate and bounded - its messageIds stay on the exhausted row
   * for manual replay - whereas the alternative is losing every
   * subsequent slice too. The gate is membership-based: the cursor is
   * "not past the window" exactly when the next unprocessed message falls
   * inside the exhausted window, so the advance can never move the cursor
   * backwards over a window that was already passed.
   */
  async #skipPoisonSlice(
    scope: SessionScope,
    row: DlqBatchRow,
    replayPhase: ConsolidatorPhase,
  ): Promise<void> {
    if (replayPhase !== 'standard' || row.messageIds.length === 0) return;
    const store = this.#consolidatorStore;
    if (store === null) return;
    const session = this.#store.session;
    if (typeof session.listMessagesSince !== 'function') return;
    const tip = row.messageIds[row.messageIds.length - 1];
    if (tip === undefined) return;
    const state = await store.getState(scope);
    const cursor = state?.lastProcessedMessageId ?? null;
    if (cursor === tip) return;
    const next = (await session.listMessagesSince(scope, cursor, 1))[0];
    if (next === undefined || !row.messageIds.includes(next.id)) return;
    await store.upsertState(scope, { lastProcessedMessageId: tip });
    process.stderr.write(
      `[graphorin/memory] poison slice skipped: standard-phase DLQ batch '${row.id}' exhausted its retries with the cursor still inside the failed window - advancing lastProcessedMessageId past ${row.messageIds.length} message(s); the ids remain on the exhausted row for manual replay.\n`,
    );
  }

  // ---------------------------------------------------------------------------

  #planPhases(reason: ConsolidatorTriggerReason): ConsolidatorPhase[] {
    const enabled = new Set(this.#config.phases);
    const planned: ConsolidatorPhase[] = [];
    if (
      reason.kind === 'turn' ||
      reason.kind === 'idle' ||
      reason.kind === 'event' ||
      reason.kind === 'buffer'
    ) {
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
      // counter survives process restart (DEC-150 - same code path
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
      // MCON-10: a failed DLQ *replay* must not enqueue a fresh DLQ row -
      // the original row already tracks the failure (drainDlq reschedules
      // or exhausts it); double-tracking multiplies rows per drain.
      const isDlqReplay =
        reason.kind === 'manual' &&
        typeof reason.value === 'string' &&
        reason.value.startsWith('dlq-replay:');
      if (this.#consolidatorStore !== null && !isDlqReplay) {
        // W-143: the phase's work is already done (and its failure
        // captured in `outcome`); a transient storage error while
        // ENQUEUEING the DLQ row must not skip run accounting or hold
        // the scope lock until staleness takeover.
        try {
          await this.#consolidatorStore.enqueueFailedBatch({
            id: this.#randomId(),
            consolidatorRunId: runId,
            scope,
            // MCON-10: capture the slice that actually failed so replays
            // can be audited against it; the cursor may move past this
            // window before the replay fires. W-142: read per scope - a
            // concurrent dispatch on ANOTHER scope must not have replaced
            // this scope's slice.
            messageIds: this.#dispatchMessageIdsByScope.get(scopeKey(scope)) ?? [],
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
            // MCON-10: persist the failed phase - replays must re-run the
            // SAME phase, not an inferred 'standard'.
            phase,
          });
        } catch (accountingErr) {
          this.#recordAccountingFailure('enqueue-failed-batch', scope, phase, accountingErr);
        }
      }
    } finally {
      // W-142: the entry must not outlive its dispatch (the catch above
      // has already consumed it by the time finally runs); without this
      // the map would leak one entry per scope forever.
      this.#dispatchMessageIdsByScope.delete(scopeKey(scope));
    }
    if (outcome.emptyExtractions > 0) {
      this.#emptyExtractions += outcome.emptyExtractions;
    }
    // W-143: completion accounting is best-effort, the lock release is
    // not. Pre-fix, a transient storage error (SQLITE_BUSY) in
    // recordRunFinish/upsertState flew out of #runPhase, leaving the
    // scope lock held until staleness takeover (5-15 minutes by tier),
    // the consolidator_runs row forever unfinished, and every trigger
    // of the window deferred - although the phase's work was already
    // committed. Each accounting step now records its failure and
    // continues; the release itself is guarded so a release error
    // cannot mask the accounting one.
    try {
      if (this.#consolidatorStore !== null) {
        try {
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
            // MCON-17: the P1-2 / P1-1 counters were computed on the outcome
            // and then dropped - the run audit lost them.
            episodesFormed: outcome.episodesFormed,
            insightsCreated: outcome.insightsCreated,
            errorMessage: outcome.errorMessage,
          });
        } catch (accountingErr) {
          this.#recordAccountingFailure('record-run-finish', scope, phase, accountingErr);
        }
        try {
          await this.#consolidatorStore.upsertState(scope, {
            lastPhase: phase,
            lastCompletedAt: this.#now(),
            nextEligibleAt: this.#now() + this.#config.ceilings.cooldownMs,
          });
        } catch (accountingErr) {
          this.#recordAccountingFailure('upsert-state', scope, phase, accountingErr);
        }
      }
    } finally {
      try {
        await this.#lockManager.release(scope, runId);
      } catch (releaseErr) {
        this.#recordAccountingFailure('lock-release', scope, phase, releaseErr);
      }
    }
    return this.#emit(outcome, scope, reason);
  }

  /**
   * W-143: surface a swallowed completion-accounting error as a
   * dedicated error span. Swallowing is deliberate (the phase's work is
   * committed; the lock must be released), but a systematic store
   * problem must stay visible to operators.
   */
  #recordAccountingFailure(
    step: string,
    scope: SessionScope,
    phase: ConsolidatorPhase,
    err: unknown,
  ): void {
    const span = this.#tracer.startSpan({
      type: 'x.memory.consolidator.accounting',
      attrs: { step, phase, userId: scope.userId },
    });
    span.recordException(err);
    span.setStatus('error');
    span.end();
  }

  async #dispatch(phase: ConsolidatorPhase, scope: SessionScope): Promise<PhaseOutcome> {
    // MCON-10: reset the failed-slice capture per dispatch; the standard
    // branch refills it from the batch it actually processes. W-142:
    // scoped to this dispatch's scope only.
    this.#dispatchMessageIdsByScope.delete(scopeKey(scope));
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
      const standardProvider = this.#cheapProvider ?? this.#provider;
      if (standardProvider === null) {
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
      this.#dispatchMessageIdsByScope.set(
        scopeKey(scope),
        rawBatch.map((r) => r.id),
      );
      const out = await runStandardPhase({
        semantic: this.#semantic,
        episodic: this.#episodic,
        formEpisodes: this.#config.formEpisodes,
        importanceScoring: this.#config.importanceScoring,
        autoPromoteExtraction: this.#config.autoPromoteExtraction,
        contextualRetrieval: this.#config.contextualRetrieval,
        store: this.#store,
        consolidatorStore: this.#consolidatorStore,
        // MCON-7: the standard phase routes to the cheap-tier provider
        // when one is configured.
        provider: standardProvider,
        tracer: this.#tracer,
        scope,
        cheapModel: this.#config.cheapModel,
        noiseFilters: this.#config.noiseFilters as ReadonlyArray<NoiseFilterPreset>,
        ingestGate: this.#config.ingestGate,
        maxBatchSize: this.#config.maxStandardBatchSize,
        maxTranscriptChars: this.#config.maxTranscriptChars,
        lastProcessedMessageId,
        budget: this.#budget,
        tier: this.#config.tier === 'free' ? 'cheap' : this.#config.tier,
        now: this.#now,
        batch: rawBatch,
        ...(this.#priceUsage !== null ? { priceUsage: this.#priceUsage } : {}),
      });
      const cursor = tipMessageId(rawBatch);
      if (cursor !== null && this.#consolidatorStore !== null) {
        await this.#consolidatorStore.upsertState(scope, {
          lastProcessedMessageId: cursor,
        });
      }
      return out;
    }
    const deepProvider = this.#deepProvider ?? this.#provider;
    if (deepProvider === null) {
      throw new ProviderNotConfiguredError('deep');
    }
    const deepOut = await runDeepPhase({
      store: this.#store,
      consolidatorStore: this.#consolidatorStore,
      provider: deepProvider,
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
      ...(this.#priceUsage !== null ? { priceUsage: this.#priceUsage } : {}),
    });
    let out: PhaseOutcome = deepOut;
    // Wave-D D4: the deterministic promotion step runs right after the
    // conflict drain, so freshly-settled facts are candidates and every
    // later pass (reflection, curated blocks, profile projection) sees
    // the promoted state. No LLM call - pure policy over recall
    // evidence, executed through the audited validate path.
    if (this.#config.promotion !== null) {
      const factsPromoted = await this.#runPromotionStep(scope, this.#config.promotion);
      out = { ...out, factsPromoted };
    }
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
        // MCON-7: reflection rides the deep-tier provider.
        provider: deepProvider,
        tracer: this.#tracer,
        scope,
        semantic: this.#semantic,
        episodic: this.#episodic,
        insights: insightStore,
        budget: this.#budget,
        importanceThreshold: this.#config.importanceThreshold,
        reflectionWatermark: priorWatermark,
        maxQuestions: this.#config.reflectionMaxQuestions,
        maxQuarantinedInsights: this.#config.reflectionMaxQuarantinedInsights,
        now: this.#now,
        ...(this.#priceUsage !== null ? { priceUsage: this.#priceUsage } : {}),
      });
      if (this.#consolidatorStore !== null && reflection.nextWatermark !== priorWatermark) {
        await this.#consolidatorStore.upsertState(scope, {
          reflectionWatermark: reflection.nextWatermark,
        });
      }
      out = {
        ...out,
        insightsCreated: reflection.insightsCreated,
        llmTokensUsed: out.llmTokensUsed + reflection.tokens,
        llmCostUsd:
          out.llmCostUsd === null && reflection.costUsd === 0
            ? null
            : (out.llmCostUsd ?? 0) + reflection.costUsd,
      };
    }
    // Curated-block passes (D3, generalised in wave-D): the registered
    // list - incl. the learned_context entry contributed by the
    // `learnedContext: true` sugar - is rewritten block by block.
    // Double-gated: a non-empty list and a working-tier handle wired.
    // Rides the deep provider + budget like reflection.
    if (this.#config.curatedBlocks.length > 0 && this.#working !== null) {
      let curatedBlocksUpdated = 0;
      for (const block of this.#config.curatedBlocks) {
        const rewritten = await runCuratedBlockPass({
          provider: deepProvider,
          tracer: this.#tracer,
          scope,
          working: this.#working,
          episodic: this.#episodic,
          store: this.#store,
          budget: this.#budget,
          maxChars: block.maxChars,
          label: block.label,
          ...(block.prompt !== null ? { systemPrompt: block.prompt } : {}),
          now: this.#now,
          ...(this.#priceUsage !== null ? { priceUsage: this.#priceUsage } : {}),
        });
        if (rewritten.updated) curatedBlocksUpdated += 1;
        out = {
          ...out,
          ...(block.label === LEARNED_CONTEXT_BLOCK_LABEL
            ? { learnedContextUpdated: rewritten.updated }
            : {}),
          llmTokensUsed: out.llmTokensUsed + rewritten.tokens,
          llmCostUsd:
            out.llmCostUsd === null && rewritten.costUsd === 0
              ? null
              : (out.llmCostUsd ?? 0) + rewritten.costUsd,
        };
      }
      out = { ...out, curatedBlocksUpdated };
    }
    // Profile-projection pass (wave-D D2) runs last: it reads the facts
    // the drain above may have just settled. Same double-gate + deep
    // provider + budget envelope as the learned-context pass.
    if (this.#config.profileProjection !== null && this.#working !== null) {
      const projected = await runProfileProjectionPass({
        provider: deepProvider,
        tracer: this.#tracer,
        scope,
        working: this.#working,
        store: this.#store,
        budget: this.#budget,
        config: this.#config.profileProjection,
        now: this.#now,
        ...(this.#priceUsage !== null ? { priceUsage: this.#priceUsage } : {}),
      });
      out = {
        ...out,
        profileProjectionUpdated: projected.updated,
        llmTokensUsed: out.llmTokensUsed + projected.tokens,
        llmCostUsd:
          out.llmCostUsd === null && projected.costUsd === 0
            ? null
            : (out.llmCostUsd ?? 0) + projected.costUsd,
      };
    }
    return out;
  }

  /**
   * Wave-D D4: execute the deterministic promotion policy - list the
   * quarantined candidates with their recall stats, apply the pure
   * `shouldPromote` verdict, and promote each winner through the
   * audited `SemanticMemory.validate` path (which refuses
   * injection-flagged facts - those are counted and skipped, never
   * forced). Returns the number of facts promoted.
   */
  async #runPromotionStep(scope: SessionScope, policy: ResolvedPromotionPolicy): Promise<number> {
    return withMemorySpan(
      this.#tracer,
      'memory.consolidate.promotion',
      scope,
      { 'consolidator.phase': 'promotion' },
      async (span) => {
        const listCandidates = this.#store.semantic.listPromotionCandidates;
        if (typeof listCandidates !== 'function') {
          span.setAttributes({ 'consolidator.promotion.skipped': 'no-candidate-surface' });
          return 0;
        }
        const candidates = await listCandidates.call(this.#store.semantic, scope, {});
        const nowMs = this.#now();
        let promoted = 0;
        let refused = 0;
        for (const candidate of candidates) {
          if (promoted >= policy.maxPerRun) break;
          if (!shouldPromote(candidate, policy, nowMs)) continue;
          try {
            await this.#semantic.validate(scope, candidate.fact.id, 'promotion-policy');
            promoted += 1;
          } catch {
            // QuarantinePromotionRefusedError (injection-flagged) or a
            // storage hiccup - never force, never fail the deep phase.
            refused += 1;
          }
        }
        span.setAttributes({
          'consolidator.promotion.candidates': candidates.length,
          'consolidator.promotion.promoted': promoted,
          'consolidator.promotion.refused': refused,
        });
        return promoted;
      },
    );
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
  reason: 'tokens-exceeded' | 'cost-exceeded' | 'paused' | 'cooldown',
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
    errorMessage: `phase skipped - ${reason}`,
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
    noiseFilters: Object.freeze([...(opts.noiseFilters ?? ['default'])]),
    ingestGate: opts.ingestGate ?? null,
    lockWaitMs: opts.lockWaitMs ?? 30_000,
    decayTauDays: opts.decayTauDays ?? 7,
    decayArchiveThreshold: opts.decayArchiveThreshold ?? 0.05,
    decayCapacity: opts.decayCapacity ?? null,
    salienceWeights: opts.salienceWeights ?? DEFAULT_SALIENCE_WEIGHTS,
    maxStandardBatchSize: opts.maxStandardBatchSize ?? 50,
    maxTranscriptChars: opts.maxTranscriptChars ?? preset.maxTranscriptChars,
    maxDeepConflictsPerRun: opts.maxDeepConflictsPerRun ?? 20,
    dlqMaxRetries: opts.dlqMaxRetries ?? 5,
    dlqBaseBackoffMs: opts.dlqBaseBackoffMs ?? 60_000,
    dlqMaxBackoffMs: opts.dlqMaxBackoffMs ?? 60 * 60 * 1000,
    formEpisodes: opts.formEpisodes ?? preset.formEpisodes,
    importanceScoring: opts.importanceScoring ?? preset.importanceScoring,
    // MCON-2: opt-in only - fail-safe (quarantine) stays the default at every tier.
    autoPromoteExtraction: opts.autoPromoteExtraction ?? false,
    reflection: opts.reflection ?? preset.reflection,
    importanceThreshold: opts.importanceThreshold ?? preset.importanceThreshold,
    reflectionMaxQuestions: opts.reflectionMaxQuestions ?? preset.reflectionMaxQuestions,
    reflectionMaxQuarantinedInsights:
      opts.reflectionMaxQuarantinedInsights ?? preset.reflectionMaxQuarantinedInsights,
    contextualRetrieval: opts.contextualRetrieval ?? preset.contextualRetrieval,
    learnedContext: opts.learnedContext ?? preset.learnedContext,
    learnedContextMaxChars: opts.learnedContextMaxChars ?? preset.learnedContextMaxChars,
    curatedBlocks: resolveCuratedBlocks(opts, preset),
    // Wave-D D2: not per-tier - configured via createMemory({ profile }).
    profileProjection:
      opts.profileProjection === undefined
        ? null
        : resolveProfileProjectionConfig(opts.profileProjection),
    // Wave-D D4: not per-tier - opt-in, ingest-gate-gated at the facade.
    promotion: opts.promotion === undefined ? null : resolvePromotionPolicy(opts.promotion),
  });
}

/**
 * Wave-D D3: merge the `learnedContext: true` sugar with the explicit
 * `curatedBlocks` list into the resolved config, validating labels
 * (unique, non-empty, never the reserved `profile`).
 */
function resolveCuratedBlocks(
  opts: CreateConsolidatorOptions,
  preset: { readonly learnedContext: boolean; readonly learnedContextMaxChars: number },
): ReadonlyArray<ResolvedCuratedBlock> {
  const learnedContext = opts.learnedContext ?? preset.learnedContext;
  const learnedContextMaxChars = opts.learnedContextMaxChars ?? preset.learnedContextMaxChars;
  const out: ResolvedCuratedBlock[] = [];
  if (learnedContext) {
    out.push({
      label: LEARNED_CONTEXT_BLOCK_LABEL,
      prompt: null,
      maxChars: learnedContextMaxChars,
    });
  }
  for (const spec of opts.curatedBlocks ?? []) {
    const label = typeof spec.label === 'string' ? spec.label.trim() : '';
    if (label.length === 0) {
      throw new CuratedBlocksMisconfiguredError(String(spec.label), 'empty');
    }
    if (label === PROFILE_BLOCK_LABEL) {
      throw new CuratedBlocksMisconfiguredError(label, 'reserved');
    }
    if (out.some((entry) => entry.label === label)) {
      throw new CuratedBlocksMisconfiguredError(label, 'duplicate');
    }
    out.push({
      label,
      prompt: spec.prompt ?? null,
      maxChars: spec.maxChars ?? learnedContextMaxChars,
    });
  }
  return Object.freeze(out);
}

function defaultTriggers(): ConsolidatorTriggerSpec[] {
  // `idle:5m` drives the light + standard phases between sessions; the daily
  // cron is what makes the **deep** phase reachable (it drains the deferred
  // conflict-check queue + runs reflection - `#planPhases` only schedules deep
  // for cron / manual / budget reasons). A `turn:N` default was dropped: the
  // scheduler cannot count user turns, so it was inert unless a consumer
  // emitted `trigger({ kind: 'turn' })` itself (MCON-4).
  return ['idle:5m', 'cron:0 4 * * *'];
}

/**
 * Smallest `buffer:N` threshold among the configured trigger specs
 * (item 7, A2). Unparseable specs are skipped here - they already
 * fail loudly at registration / config-validation time.
 */
function minBufferThreshold(specs: ReadonlyArray<ConsolidatorTriggerSpec>): number | null {
  let min: number | null = null;
  for (const spec of specs) {
    let kind: string;
    let tokens = 0;
    try {
      const parsed = parseTriggerSpec(spec);
      kind = parsed.kind;
      if (parsed.kind === 'buffer') tokens = parsed.tokens;
    } catch {
      continue;
    }
    if (kind !== 'buffer') continue;
    if (min === null || tokens < min) min = tokens;
  }
  return min;
}

/**
 * BUFFER-N-01: emit a construction-time WARN for every trigger spec that fails
 * to parse. `minBufferThreshold` swallows these silently (they are meant to fail
 * loudly at registration), but a buffer-only library deployment never registers
 * with a scheduler, so without this the invalid spec vanishes without a trace.
 */
function warnInvalidTriggerSpecs(specs: ReadonlyArray<ConsolidatorTriggerSpec>): void {
  for (const spec of specs) {
    try {
      parseTriggerSpec(spec);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `${detail} This spec is IGNORED at construction, so the loop it was meant to arm ` +
          `(e.g. the buffer memory-formation cycle) never fires. Fix the spec and re-create the consolidator.\n`,
      );
    }
  }
}
