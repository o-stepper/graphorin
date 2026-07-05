/**
 * Public types for the minimal inline eval runner. Full orchestrator,
 * scorer libraries, dataset loaders, and reporters live in the
 * separate `@graphorin/evals` package (post-MVP).
 *
 * @packageDocumentation
 */

/**
 * One sample from an eval dataset.
 *
 * @stable
 */
export interface Case<I, O = unknown, M = Readonly<Record<string, unknown>>> {
  readonly id?: string;
  readonly input: I;
  readonly expected?: O;
  readonly metadata?: M;
}

/**
 * @stable
 */
export interface Dataset<I, O = unknown, M = Readonly<Record<string, unknown>>> {
  readonly cases: ReadonlyArray<Case<I, O, M>>;
  readonly metadata?: {
    readonly name?: string;
    readonly description?: string;
    readonly createdAt?: Date;
  };
}

/**
 * Output of {@link Scorer.score}.
 *
 * @stable
 */
export interface ScoreResult {
  readonly pass: boolean;
  /** Optional normalized score in `[0, 1]`. */
  readonly score?: number;
  readonly reason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * @stable
 */
export interface Scorer<I, O = unknown> {
  readonly name: string;
  score(args: {
    readonly case: Case<I, O>;
    readonly output: O;
    readonly durationMs: number;
  }): Promise<ScoreResult>;
}

/**
 * Per-case result.
 *
 * @stable
 */
export interface EvalCaseResult<I, O> {
  readonly caseId: string;
  readonly input: I;
  readonly output: O;
  readonly durationMs: number;
  readonly scores: ReadonlyArray<{ readonly scorer: string; readonly result: ScoreResult }>;
}

/**
 * Final report shape.
 *
 * @stable
 */
export interface EvalReport<I, O> {
  readonly results: ReadonlyArray<EvalCaseResult<I, O>>;
  readonly summary: {
    readonly total: number;
    readonly passed: number;
    readonly failed: number;
    readonly avgDurationMs: number;
    readonly byScorer: Readonly<
      Record<
        string,
        { readonly passed: number; readonly failed: number; readonly avgScore: number | null }
      >
    >;
    /**
     * 95% Wilson score interval on the overall pass rate (E8 / evals-05).
     * Always present on reports produced by `runEvals`; optional so older
     * persisted reports keep parsing.
     */
    readonly passRateCi?: { readonly lo: number; readonly hi: number };
    /**
     * pass^k stability metric - fraction of base cases whose EVERY repeat
     * iteration passed. Present only when the run used `iterations > 1`.
     */
    readonly passHatK?: {
      readonly k: number;
      readonly baseCases: number;
      readonly value: number;
    };
  };
  /**
   * `true` when the run was cut short by an aborted signal - `results` and
   * `summary` then cover only the cases that finished before the abort (a
   * partial report). Absent on a normal full run. See `runEvals`.
   */
  readonly aborted?: boolean;
}

/**
 * @stable
 */
export interface RunEvalOptions<I, O> {
  readonly agent: { readonly run: (input: I) => Promise<O> };
  readonly dataset: Dataset<I, O>;
  readonly scorers: ReadonlyArray<Scorer<I, O>>;
  readonly iterations?: number;
  readonly signal?: AbortSignal;
}
