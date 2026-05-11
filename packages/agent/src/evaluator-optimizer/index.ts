/**
 * `evaluatorOptimizer({...})` — Generator → Evaluator iteration
 * loop with three rubric kinds and a REQUIRED iteration cap.
 *
 * Iteration boundary discipline: each iteration is a fresh
 * agent.run-equivalent boundary. Intra-loop reasoning per RB-42 /
 * suggested DEC-158 applies WITHIN one iteration, not ACROSS
 * iterations. The Generator's iteration-N input is the original
 * user input + the Evaluator's iteration-(N-1) critique (NOT the
 * Generator's iteration-(N-1) internal message history).
 *
 * @packageDocumentation
 */

import type { AgentEvent } from '@graphorin/core';
import { EvaluatorOptimizerConfigError } from '../errors/index.js';

/**
 * Rubric discriminator. Pick the variant that matches your
 * Evaluator's contract.
 *
 * @stable
 */
export type Rubric =
  | { readonly kind: 'free-form'; readonly instructions: string }
  | { readonly kind: 'zod'; readonly instructions: string }
  | { readonly kind: 'llm-judge'; readonly promptTemplate: string };

/**
 * Per-iteration evaluation outcome returned by the Evaluator.
 *
 * @stable
 */
export interface EvaluatorOutcome {
  readonly score: number;
  readonly pass: boolean;
  readonly critique: string;
}

/**
 * Generator callable shape. Receives the original user input plus
 * the previous iteration's critique (or `undefined` on the first
 * iteration) and returns the new candidate output.
 *
 * @stable
 */
export type GeneratorCallable<TOutput> = (
  input: string,
  priorCritique: string | undefined,
  iteration: number,
) => Promise<TOutput>;

/**
 * Evaluator callable shape. Receives the original user input + the
 * candidate output and returns the structured outcome.
 *
 * @stable
 */
export type EvaluatorCallable<TOutput> = (
  input: string,
  candidate: TOutput,
  rubric: Rubric,
  iteration: number,
) => Promise<EvaluatorOutcome>;

/**
 * Options accepted by {@link evaluatorOptimizer}. `maxIterations`
 * is REQUIRED — the helper asserts `>= 1` at construction time.
 *
 * @stable
 */
export interface EvaluatorOptimizerOptions<TOutput> {
  readonly generator: GeneratorCallable<TOutput>;
  readonly evaluator: EvaluatorCallable<TOutput>;
  readonly maxIterations: number;
  readonly rubric: Rubric;
  readonly mergeStrategy?: 'last-iteration' | 'best-score';
  readonly signal?: AbortSignal;
  /** Optional event emitter for `agent.evaluator.iteration / converged`. */
  readonly emit?: (event: AgentEvent) => void;
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
}

/**
 * Aggregate outcome of an `evaluatorOptimizer({...})` run.
 *
 * @stable
 */
export interface EvaluatorOptimizerOutcome<TOutput> {
  readonly output: TOutput;
  readonly iterations: ReadonlyArray<{
    readonly iteration: number;
    readonly candidate: TOutput;
    readonly score: number;
    readonly pass: boolean;
    readonly critique: string;
    readonly durationMs: number;
  }>;
  readonly terminationReason: 'pass' | 'maxIterations' | 'generator-exhausted' | 'cancelled';
  readonly finalScore: number;
}

/**
 * Run the Generator → Evaluator iteration loop.
 *
 * @stable
 */
export async function evaluatorOptimizer<TOutput>(
  input: string,
  options: EvaluatorOptimizerOptions<TOutput>,
): Promise<EvaluatorOptimizerOutcome<TOutput>> {
  if (!Number.isFinite(options.maxIterations) || options.maxIterations < 1) {
    throw new EvaluatorOptimizerConfigError(
      `'maxIterations' must be >= 1 (got ${String(options.maxIterations)})`,
    );
  }
  const mergeStrategy = options.mergeStrategy ?? 'last-iteration';
  const iterations: Array<{
    iteration: number;
    candidate: TOutput;
    score: number;
    pass: boolean;
    critique: string;
    durationMs: number;
  }> = [];

  let priorCritique: string | undefined;
  let terminationReason: EvaluatorOptimizerOutcome<TOutput>['terminationReason'] = 'maxIterations';

  for (let i = 1; i <= options.maxIterations; i++) {
    if (options.signal !== undefined && options.signal.aborted) {
      terminationReason = 'cancelled';
      break;
    }
    const iterStart = Date.now();
    let candidate: TOutput;
    try {
      candidate = await options.generator(input, priorCritique, i);
    } catch {
      terminationReason = 'generator-exhausted';
      break;
    }
    const outcome = await options.evaluator(input, candidate, options.rubric, i);
    const iterDuration = Date.now() - iterStart;

    iterations.push({
      iteration: i,
      candidate,
      score: outcome.score,
      pass: outcome.pass,
      critique: outcome.critique,
      durationMs: iterDuration,
    });

    options.emit?.({
      type: 'agent.evaluator.iteration',
      runId: options.runId,
      sessionId: options.sessionId,
      agentId: options.agentId,
      iteration: i,
      score: outcome.score,
      pass: outcome.pass,
      critique: outcome.critique,
      durationMs: iterDuration,
    });

    if (outcome.pass) {
      terminationReason = 'pass';
      break;
    }
    priorCritique = outcome.critique;
  }

  let finalEntry: (typeof iterations)[number];
  if (iterations.length === 0) {
    // Should only happen on `cancelled` before the first iteration —
    // synthesize a no-op final entry.
    finalEntry = {
      iteration: 0,
      candidate: '' as unknown as TOutput,
      score: 0,
      pass: false,
      critique: '',
      durationMs: 0,
    };
  } else if (mergeStrategy === 'best-score') {
    finalEntry = iterations.reduce((best, current) =>
      current.score > best.score ? current : best,
    );
  } else {
    finalEntry = iterations[iterations.length - 1] as (typeof iterations)[number];
  }

  options.emit?.({
    type: 'agent.evaluator.converged',
    runId: options.runId,
    sessionId: options.sessionId,
    agentId: options.agentId,
    totalIterations: iterations.length,
    finalScore: finalEntry.score,
    terminationReason,
  });

  return {
    output: finalEntry.candidate,
    iterations,
    terminationReason,
    finalScore: finalEntry.score,
  };
}
