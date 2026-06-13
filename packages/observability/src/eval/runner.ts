/**
 * `runEval(...)` — minimal inline eval runner. Walks every case in
 * the dataset, calls `agent.run(case.input)`, applies every supplied
 * scorer, and returns an aggregated {@link EvalReport}.
 *
 * The runner is deliberately tiny — it has no parallelism, no
 * retries, no reporters, no dataset loaders. Production scenarios
 * that need any of those should `pnpm add @graphorin/evals` (post-MVP).
 *
 * @packageDocumentation
 */

import type {
  Case,
  EvalCaseResult,
  EvalReport,
  RunEvalOptions,
  ScoreResult,
  Scorer,
} from './types.js';

/**
 * @stable
 */
export async function runEval<I, O>(opts: RunEvalOptions<I, O>): Promise<EvalReport<I, O>> {
  const iterations = Math.max(1, opts.iterations ?? 1);
  const signal = opts.signal;
  const results: EvalCaseResult<I, O>[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    for (let idx = 0; idx < opts.dataset.cases.length; idx++) {
      throwIfAborted(signal);
      const sampleCase = opts.dataset.cases[idx];
      if (sampleCase === undefined) continue;
      // EB-6: disambiguate a caller-provided id per iteration too, not just the
      // synthetic fallback — otherwise iterations>1 emits duplicate caseIds.
      const baseId = sampleCase.id ?? `case-${idx}`;
      const caseId = iterations === 1 ? baseId : `${baseId}-iter-${iter}`;

      const startedAt = Date.now();
      const output = await opts.agent.run(sampleCase.input);
      const durationMs = Date.now() - startedAt;

      const scores: EvalCaseResult<I, O>['scores'][number][] = [];
      for (const scorer of opts.scorers) {
        throwIfAborted(signal);
        const result = await safeScore(scorer, sampleCase, output, durationMs);
        scores.push({ scorer: scorer.name, result });
      }

      results.push({
        caseId,
        input: sampleCase.input,
        output,
        durationMs,
        scores,
      });
    }
  }

  return summarize(results, opts.scorers);
}

async function safeScore<I, O>(
  scorer: Scorer<I, O>,
  c: Case<I, O>,
  output: O,
  durationMs: number,
): Promise<ScoreResult> {
  try {
    return await scorer.score({ case: c, output, durationMs });
  } catch (err) {
    return {
      pass: false,
      reason: `Scorer "${scorer.name}" threw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function summarize<I, O>(
  results: ReadonlyArray<EvalCaseResult<I, O>>,
  scorers: ReadonlyArray<Scorer<I, O>>,
): EvalReport<I, O> {
  const total = results.length;
  let passed = 0;
  let failed = 0;
  let durationSum = 0;
  const byScorer: Record<
    string,
    { passed: number; failed: number; scoreSum: number; scoreCount: number }
  > = {};

  for (const scorer of scorers) {
    byScorer[scorer.name] = { passed: 0, failed: 0, scoreSum: 0, scoreCount: 0 };
  }

  for (const r of results) {
    durationSum += r.durationMs;
    let passEntire = true;
    for (const { scorer, result } of r.scores) {
      const bucket = byScorer[scorer] ?? { passed: 0, failed: 0, scoreSum: 0, scoreCount: 0 };
      if (result.pass) bucket.passed += 1;
      else {
        bucket.failed += 1;
        passEntire = false;
      }
      if (typeof result.score === 'number' && Number.isFinite(result.score)) {
        bucket.scoreSum += result.score;
        bucket.scoreCount += 1;
      }
      byScorer[scorer] = bucket;
    }
    if (passEntire) passed += 1;
    else failed += 1;
  }

  const summaryByScorer: Record<
    string,
    { passed: number; failed: number; avgScore: number | null }
  > = {};
  for (const [scorer, b] of Object.entries(byScorer)) {
    summaryByScorer[scorer] = {
      passed: b.passed,
      failed: b.failed,
      avgScore: b.scoreCount === 0 ? null : b.scoreSum / b.scoreCount,
    };
  }

  return {
    results,
    summary: {
      total,
      passed,
      failed,
      avgDurationMs: total === 0 ? 0 : durationSum / total,
      byScorer: Object.freeze(summaryByScorer),
    },
  };
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted === true) {
    const reason = signal.reason;
    throw reason instanceof Error ? reason : new Error('Eval run aborted');
  }
}
