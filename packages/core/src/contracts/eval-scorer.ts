/**
 * Pluggable evaluation scorer. Generic over the input / output types
 * carried by the eval dataset. Concrete implementations live in the
 * separate `@graphorin/evals` package (post-MVP); the interface lives
 * here so that:
 *
 * - The minimal inline runner shipped with `@graphorin/observability` can
 *   type-check against it.
 * - Custom application-level scorers can be defined without taking an
 *   evals dependency.
 *
 * @stable
 */
export interface EvalScorer<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly description?: string;
  score(sample: EvalSample<TInput, TOutput>): Promise<EvalScore>;
}

/**
 * A single sample from an eval dataset.
 *
 * @stable
 */
export interface EvalSample<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly input: TInput;
  readonly expected?: TOutput;
  readonly actual: TOutput;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Result of `EvalScorer.score(...)`. `value` is normalized to `[0, 1]`
 * by convention; raw scores can be carried in `details`.
 *
 * @stable
 */
export interface EvalScore {
  readonly value: number;
  readonly pass?: boolean;
  readonly rationale?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}
