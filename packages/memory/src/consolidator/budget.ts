/**
 * Cost-budget enforcement for the consolidator. The tracker is a
 * pure in-memory state machine: it owns the day-bucketed counters
 * (token + cost), the UTC reset semantics, and the `onExceed`
 * dispatch.
 *
 * The tracker does not perform any I/O - operators surface the live
 * counters via `Consolidator.status()` and the persisted snapshot is
 * derived from `consolidator_runs` rows.
 *
 * @packageDocumentation
 */

import { BudgetExceededError } from './errors.js';
import type { ConsolidatorPhase, OnBudgetExceed } from './types.js';

/**
 * @stable
 */
export interface BudgetSnapshot {
  readonly tokensUsedToday: number;
  readonly costUsedToday: number;
  readonly tokensRemaining: number;
  readonly costRemaining: number;
  readonly resetAt: string;
  readonly paused: boolean;
}

/**
 * @stable
 */
export interface BudgetCheck {
  readonly allowed: boolean;
  readonly reason?: 'paused' | 'tokens-exceeded' | 'cost-exceeded';
}

/**
 * @stable
 */
export interface BudgetTrackerOptions {
  readonly maxTokensPerDay: number;
  readonly maxCostPerDay: number;
  readonly onExceed: OnBudgetExceed;
  readonly resetSemantics: 'utc' | 'local' | 'sliding-24h';
  readonly now?: () => number;
  /**
   * Sink for the `onExceed: 'log'` WARN (memory-consolidation-02).
   * Defaults to `process.stderr`. One WARN per resource per budget
   * window - the shipped standard/full presets use `'log'`, so without
   * it a breached ceiling was completely silent.
   */
  readonly logger?: (message: string) => void;
}

/**
 * Per-instance budget tracker. The runtime creates one tracker per
 * consolidator and resets the day counters lazily on the next phase
 * invocation.
 *
 * @stable
 */
export class BudgetTracker {
  readonly #now: () => number;
  readonly #resetSemantics: 'utc' | 'local' | 'sliding-24h';
  readonly #onExceed: OnBudgetExceed;
  readonly #logger: (message: string) => void;
  #maxTokensPerDay: number;
  #maxCostPerDay: number;
  #bucketStart: number;
  #tokens = 0;
  #cost = 0;
  #paused = false;
  #pausedReason: 'tokens-exceeded' | 'cost-exceeded' | null = null;
  /** Resources already WARNed this window under `onExceed: 'log'` (memory-consolidation-02). */
  #warnedThisWindow = new Set<'tokens' | 'cost'>();
  /**
   * Timestamped spend ledger for `sliding-24h` only. `#maybeReset` trims it to
   * the trailing 24h window and recomputes `#tokens` / `#cost` from it, so the
   * counters reflect a true rolling window instead of being zeroed on every
   * check (MCON-3). Unused - and never appended to - under `utc` / `local`.
   */
  #ledger: Array<{ at: number; tokens: number; cost: number }> = [];

  constructor(opts: BudgetTrackerOptions) {
    this.#now = opts.now ?? Date.now;
    this.#resetSemantics = opts.resetSemantics;
    this.#onExceed = opts.onExceed;
    this.#logger =
      opts.logger ??
      ((message: string): void => {
        process.stderr.write(`${message}\n`);
      });
    this.#maxTokensPerDay = opts.maxTokensPerDay;
    this.#maxCostPerDay = opts.maxCostPerDay;
    this.#bucketStart = bucketStart(this.#now(), this.#resetSemantics);
  }

  /**
   * Replace the active ceilings. Used by `Consolidator.setTier(...)`.
   *
   * @stable
   */
  reconfigure(opts: { maxTokensPerDay: number; maxCostPerDay: number }): void {
    this.#maxTokensPerDay = opts.maxTokensPerDay;
    this.#maxCostPerDay = opts.maxCostPerDay;
    if (this.#paused) {
      const tokensOk = this.#tokens <= this.#maxTokensPerDay;
      const costOk = this.#cost <= this.#maxCostPerDay;
      if (tokensOk && costOk) {
        this.#paused = false;
        this.#pausedReason = null;
      }
    }
  }

  /**
   * Return whether the supplied phase may run right now.
   *
   * @stable
   */
  precheck(phase: ConsolidatorPhase): BudgetCheck {
    this.#maybeReset();
    if (phase === 'light') return { allowed: true };
    if (this.#paused) {
      const reason = this.#pausedReason ?? 'cost-exceeded';
      return { allowed: false, reason };
    }
    if (this.#maxTokensPerDay <= 0) {
      return { allowed: false, reason: 'tokens-exceeded' };
    }
    if (this.#maxCostPerDay <= 0) {
      return { allowed: false, reason: 'cost-exceeded' };
    }
    return { allowed: true };
  }

  /**
   * Record consumption. Returns the post-record state - `paused` is
   * `true` when the spend pushed past a ceiling under
   * `onExceed: 'pause'`.
   *
   * Throws {@link BudgetExceededError} when the configured behaviour
   * is `'throw'`.
   *
   * @stable
   */
  record(args: { phase: ConsolidatorPhase; tokens: number; costUsd: number }): BudgetSnapshot {
    this.#maybeReset();
    const tokens = Math.max(0, args.tokens);
    const cost = Math.max(0, args.costUsd);
    if (this.#resetSemantics === 'sliding-24h') {
      this.#ledger.push({ at: this.#now(), tokens, cost });
    }
    this.#tokens += tokens;
    this.#cost += cost;
    if (this.#tokens > this.#maxTokensPerDay) {
      this.#handleBreach(args.phase, 'tokens', this.#tokens, this.#maxTokensPerDay);
    }
    if (this.#cost > this.#maxCostPerDay) {
      this.#handleBreach(args.phase, 'cost', this.#cost, this.#maxCostPerDay);
    }
    return this.snapshot();
  }

  /**
   * Read-only snapshot. Surfaced through `Consolidator.status()`.
   *
   * @stable
   */
  snapshot(): BudgetSnapshot {
    this.#maybeReset();
    // For the rolling window the "reset" is continuous - the boundary is when
    // the oldest in-window spend ages out (24h after it landed).
    const resetAt =
      this.#resetSemantics === 'sliding-24h'
        ? (this.#ledger[0]?.at ?? this.#now()) + DAY_MS
        : nextBucketStart(this.#bucketStart, this.#resetSemantics);
    return Object.freeze({
      tokensUsedToday: this.#tokens,
      costUsedToday: this.#cost,
      tokensRemaining: Math.max(0, this.#maxTokensPerDay - this.#tokens),
      costRemaining: Math.max(0, this.#maxCostPerDay - this.#cost),
      resetAt: new Date(resetAt).toISOString(),
      paused: this.#paused,
    });
  }

  /**
   * Force a reset. Used by tests + manual operator action.
   *
   * @stable
   */
  reset(): void {
    this.#tokens = 0;
    this.#cost = 0;
    this.#paused = false;
    this.#pausedReason = null;
    this.#ledger = [];
    this.#warnedThisWindow.clear();
    this.#bucketStart = bucketStart(this.#now(), this.#resetSemantics);
  }

  #handleBreach(
    phase: ConsolidatorPhase,
    resource: 'tokens' | 'cost',
    actual: number,
    budget: number,
  ): void {
    if (this.#onExceed === 'throw') {
      throw new BudgetExceededError({ phase, resource, actual, budget });
    }
    if (this.#onExceed === 'pause') {
      this.#paused = true;
      this.#pausedReason = resource === 'tokens' ? 'tokens-exceeded' : 'cost-exceeded';
    }
    if (this.#onExceed === 'log' && !this.#warnedThisWindow.has(resource)) {
      // memory-consolidation-02: the type doc always promised "'log'
      // keeps running with a WARN" - the WARN finally exists. Once per
      // resource per budget window, so a breached daily ceiling is
      // visible without flooding.
      this.#warnedThisWindow.add(resource);
      this.#logger(
        `[graphorin/memory] consolidator ${resource} budget exceeded in phase '${phase}': ` +
          `${resource === 'cost' ? `$${actual.toFixed(4)} > $${budget.toFixed(4)}` : `${actual} > ${budget}`} ` +
          `(onExceed: 'log' - continuing; switch to 'pause'/'throw' to enforce).`,
      );
    }
  }

  #maybeReset(): void {
    const now = this.#now();
    if (this.#resetSemantics === 'sliding-24h') {
      // Rolling window: drop spends older than the trailing 24h and recompute
      // the totals from what remains, rather than zeroing on every check.
      const cutoff = now - DAY_MS;
      if (
        this.#ledger.length > 0 &&
        this.#ledger[0] !== undefined &&
        this.#ledger[0].at <= cutoff
      ) {
        this.#ledger = this.#ledger.filter((entry) => entry.at > cutoff);
      }
      this.#tokens = this.#ledger.reduce((sum, entry) => sum + entry.tokens, 0);
      this.#cost = this.#ledger.reduce((sum, entry) => sum + entry.cost, 0);
      // Auto-unpause once the window has dropped back under both ceilings.
      if (
        this.#paused &&
        this.#tokens <= this.#maxTokensPerDay &&
        this.#cost <= this.#maxCostPerDay
      ) {
        this.#paused = false;
        this.#pausedReason = null;
      }
      if (this.#tokens <= this.#maxTokensPerDay && this.#cost <= this.#maxCostPerDay) {
        this.#warnedThisWindow.clear();
      }
      return;
    }
    // utc / local: zero the counters when the calendar bucket rolls over.
    const currentBucket = bucketStart(now, this.#resetSemantics);
    if (currentBucket !== this.#bucketStart) {
      this.#bucketStart = currentBucket;
      this.#tokens = 0;
      this.#cost = 0;
      this.#paused = false;
      this.#pausedReason = null;
      this.#warnedThisWindow.clear();
    }
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute the start of the current bucket (ms epoch) for the
 * supplied reset semantics. UTC midnight is the production default
 * per ADR-038.
 *
 * @internal
 */
export function bucketStart(now: number, semantics: 'utc' | 'local' | 'sliding-24h'): number {
  switch (semantics) {
    case 'utc': {
      const d = new Date(now);
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    case 'local': {
      const d = new Date(now);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }
    case 'sliding-24h':
      return now;
  }
}

/**
 * Compute the next reset boundary (ms epoch).
 *
 * @internal
 */
export function nextBucketStart(
  bucket: number,
  semantics: 'utc' | 'local' | 'sliding-24h',
): number {
  switch (semantics) {
    case 'utc':
    case 'local':
      return bucket + DAY_MS;
    case 'sliding-24h':
      return bucket + DAY_MS;
  }
}
