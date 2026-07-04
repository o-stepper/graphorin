/**
 * Public types for the full eval framework. Re-exports the
 * {@link Case} / {@link Dataset} / {@link EvalReport} primitives from
 * `@graphorin/observability/eval` so consumers do not need to depend
 * on both packages, then layers on the framework-specific concepts:
 * agent shape, parallel runner config, regression policy, baseline
 * loaders.
 *
 * @packageDocumentation
 */

export type {
  Case,
  Dataset,
  EvalCaseResult,
  EvalReport,
  RunEvalOptions,
  ScoreResult,
  Scorer,
} from '@graphorin/observability/eval';

import type { EvalReport, Scorer } from '@graphorin/observability/eval';

/**
 * Agent shape consumed by the runner. Anything with a `run(input)`
 * method satisfies the contract — the framework's own `Agent` type
 * matches by structural typing.
 *
 * @stable
 */
export interface AgentLike<I, O> {
  run(input: I, ctx?: { signal?: AbortSignal }): Promise<O>;
}

/**
 * Options accepted by the parallel runner.
 *
 * @stable
 */
export interface RunOptions<I, O> {
  readonly agent: AgentLike<I, O>;
  readonly dataset: {
    readonly cases: ReadonlyArray<{
      readonly id?: string;
      readonly input: I;
      readonly expected?: O;
      readonly metadata?: Readonly<Record<string, unknown>>;
    }>;
  };
  readonly scorers: ReadonlyArray<Scorer<I, O>>;
  /** Default `1`. */
  readonly iterations?: number;
  /** Default `1` (sequential). Set higher for parallel evaluation. */
  readonly concurrency?: number;
  readonly signal?: AbortSignal;
  /**
   * How to handle `signal` abort. Default (`false`): stop dispatching and
   * resolve with a **partial** {@link EvalReport} (`aborted: true`) covering
   * the cases that finished — a long judged run shouldn't lose all completed
   * work to a Ctrl+C. Set `true` to throw the abort reason instead.
   */
  readonly throwOnAbort?: boolean;
  /**
   * Optional progress hook invoked after every case. Useful for
   * terminal reporters that want a per-case heartbeat.
   */
  readonly onProgress?: (event: ProgressEvent) => void;
}

/** @stable */
export interface ProgressEvent {
  readonly index: number;
  readonly total: number;
  readonly caseId: string;
  readonly durationMs: number;
  readonly passed: boolean;
}

/**
 * Regression-detection options.
 *
 * @stable
 */
export interface RegressionOptions {
  /** Minimum drop in pass-rate (in percentage points) that counts as a regression. */
  readonly maxPassRateDropPct?: number;
  /** Minimum drop in average score per scorer that counts as a regression. */
  readonly maxAvgScoreDrop?: number;
  /**
   * Maximum allowed increase in `avgDurationMs` before it counts as a
   * regression. **Opt-in: defaults to `Infinity` (gate off)** because absolute
   * wall-clock budgets are environment-sensitive (workstation baseline vs CI
   * runner, real LLM-latency jitter). Pass a finite ms budget to enable an
   * absolute duration gate; leave unset to ignore duration entirely.
   */
  readonly maxAvgDurationIncreaseMs?: number;
  /**
   * E8 (evals-05/08): when `true`, a `pass-rate-drop` finding is only kept if
   * McNemar's paired test over the shared cases rejects "no real change" at
   * {@link significanceAlpha} - a fixed percentage tolerance is blind to
   * sample size (a 5pp drop is one case in a 20-case suite). Off by default
   * so existing gates keep their exact behavior; the computed `pValue` is
   * attached to the finding either way whenever both reports carry per-case
   * results.
   */
  readonly requireSignificance?: boolean;
  /** Significance level for {@link requireSignificance}. Default `0.05`. */
  readonly significanceAlpha?: number;
}

/**
 * Result of {@link detectRegressions}.
 *
 * @stable
 */
export interface RegressionReport<I, O> {
  readonly hasRegressions: boolean;
  readonly findings: ReadonlyArray<RegressionFinding>;
  readonly current: EvalReport<I, O>;
  readonly baseline: EvalReport<I, O>;
}

/** @stable */
export interface RegressionFinding {
  readonly kind: 'pass-rate-drop' | 'avg-score-drop' | 'avg-duration-increase' | 'scorer-removed';
  readonly scorer?: string;
  readonly message: string;
  readonly delta: number;
  /**
   * Two-sided McNemar p-value over the cases shared by both reports
   * (E8; only on `pass-rate-drop` findings, and only when both reports
   * carry per-case results to pair on).
   */
  readonly pValue?: number;
}
