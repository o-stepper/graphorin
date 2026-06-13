/**
 * Parallel eval runner. Walks every case in the dataset (across N
 * iterations), executes them with bounded concurrency, applies every
 * scorer to each output, and returns an aggregated {@link EvalReport}.
 *
 * The runner respects:
 *
 *  - `concurrency` — bounded worker pool. Default `1` (sequential).
 *  - `signal` — propagated to `agent.run(...)` if the agent accepts a
 *    second `{ signal }` argument; the runner stops issuing new work
 *    on the next loop iteration.
 *  - `onProgress` — invoked after every case with a heartbeat so
 *    long-running terminals can paint a progress bar.
 *
 * @packageDocumentation
 */

import type { Case, EvalCaseResult, EvalReport, RunOptions, ScoreResult, Scorer } from './types.js';

/**
 * @stable
 */
export async function runEvals<I, O>(opts: RunOptions<I, O>): Promise<EvalReport<I, O>> {
  const iterations = Math.max(1, opts.iterations ?? 1);
  const concurrency = Math.max(1, opts.concurrency ?? 1);
  const signal = opts.signal;
  const cases = opts.dataset.cases;
  const total = cases.length * iterations;

  type WorkItem = { idx: number; iter: number; sample: Case<I, O> };
  const queue: WorkItem[] = [];
  for (let iter = 0; iter < iterations; iter++) {
    for (let idx = 0; idx < cases.length; idx++) {
      const sample = cases[idx];
      if (sample === undefined) continue;
      queue.push({ idx, iter, sample });
    }
  }

  const results: EvalCaseResult<I, O>[] = new Array(total);
  let nextWorkIndex = 0;
  let completed = 0;

  async function worker(): Promise<void> {
    while (true) {
      // EB-14: stop dispatching new work on abort, but don't throw — whatever
      // already completed must survive into a partial report.
      if (isAborted(signal)) return;
      const myIndex = nextWorkIndex++;
      if (myIndex >= queue.length) return;
      const item = queue[myIndex];
      if (item === undefined) return;
      // EB-6: a caller-provided id must still be disambiguated per iteration —
      // otherwise iterations>1 emits multiple results under one caseId and
      // JUnit/HTML reporters render indistinguishable testcases.
      const baseId = item.sample.id ?? `case-${item.idx}`;
      const caseId = iterations === 1 ? baseId : `${baseId}-iter-${item.iter}`;
      const startedAt = Date.now();
      let output: O;
      try {
        output = await opts.agent.run(
          item.sample.input,
          signal !== undefined ? { signal } : undefined,
        );
      } catch (err) {
        // An abort-induced agent failure is not a real scorer failure — drop it
        // so it doesn't pollute the partial report with spurious fails (EB-14).
        if (isAborted(signal)) return;
        const durationMs = Date.now() - startedAt;
        const failResult: EvalCaseResult<I, O> = {
          caseId,
          input: item.sample.input,
          output: undefined as unknown as O,
          durationMs,
          scores: opts.scorers.map((s) => ({
            scorer: s.name,
            result: {
              pass: false,
              reason: `agent.run threw: ${err instanceof Error ? err.message : String(err)}`,
            },
          })),
        };
        results[myIndex] = failResult;
        completed += 1;
        opts.onProgress?.({
          index: completed,
          total,
          caseId,
          durationMs,
          passed: false,
        });
        continue;
      }
      const durationMs = Date.now() - startedAt;
      const scores: EvalCaseResult<I, O>['scores'][number][] = [];
      let allPassed = true;
      for (const scorer of opts.scorers) {
        // No mid-case abort check: once agent.run completes, finish scoring so
        // the case lands intact in the partial report rather than half-done.
        const result = await safeScore(scorer, item.sample, output, durationMs);
        scores.push({ scorer: scorer.name, result });
        if (!result.pass) allPassed = false;
      }
      results[myIndex] = {
        caseId,
        input: item.sample.input,
        output,
        durationMs,
        scores,
      };
      completed += 1;
      opts.onProgress?.({
        index: completed,
        total,
        caseId,
        durationMs,
        passed: allPassed,
      });
    }
  }

  const workerCount = Math.min(concurrency, queue.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  // EB-14: an aborted run resolves with a PARTIAL report (only the cases that
  // finished) marked `aborted: true`, instead of discarding everything — a
  // long judged run shouldn't lose all completed work to a Ctrl+C. Callers who
  // prefer the old throw-on-abort opt in with `throwOnAbort`.
  if (isAborted(signal)) {
    if (opts.throwOnAbort === true) throwIfAborted(signal);
    const done = results.filter((r): r is EvalCaseResult<I, O> => r !== undefined);
    return { ...summarize(done, opts.scorers), aborted: true };
  }
  return summarize(results, opts.scorers);
}

async function safeScore<I, O>(
  scorer: Scorer<I, O>,
  sampleCase: Case<I, O>,
  output: O,
  durationMs: number,
): Promise<ScoreResult> {
  try {
    return await scorer.score({ case: sampleCase, output, durationMs });
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

// A plain function call so TypeScript re-reads `signal.aborted` each time —
// the flag flips during an `await` (external mutation) and inline
// `signal?.aborted === true` checks would otherwise be narrowed away.
function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted === true) {
    const reason = signal.reason;
    throw reason instanceof Error ? reason : new Error('Eval run aborted');
  }
}
