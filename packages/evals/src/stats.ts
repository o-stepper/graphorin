/**
 * Shared eval statistics (audit 2026-07-04, E8; closes the evals-05 /
 * evals-08 gap): confidence intervals, pass^k, and paired significance
 * for benchmark deltas. Everything here is pure and dependency-free so
 * the runner, the regression gate, and the benchmarks can share one
 * implementation instead of each inlining its own mean/stddev.
 *
 * Statistical choices, briefly:
 * - **Wilson score interval** for pass-rate CIs. Eval suites are small
 *   (n in the tens) and pass rates hug 0/1, exactly where the normal
 *   approximation interval collapses; Wilson stays sane there.
 * - **pass^k** ("pass-hat-k", the fraction of base cases that pass in
 *   ALL k repeat iterations) as the stability metric for `iterations>1`
 *   runs - a mean pass rate hides a case that flips every other run.
 * - **McNemar's test** (continuity-corrected normal approximation) for
 *   "did the pass rate really change vs the baseline": the same cases
 *   ran in both reports, so a PAIRED test on the discordant cases has
 *   far more power than comparing two independent proportions - and it
 *   is sample-size aware, which the fixed-tolerance regression gate is
 *   not.
 *
 * @packageDocumentation
 */

/**
 * Arithmetic mean; `0` for an empty list.
 *
 * @stable
 */
export function mean(values: ReadonlyArray<number>): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/**
 * Sample standard deviation (n-1 denominator); `0` for n < 2.
 *
 * @stable
 */
export function sampleStddev(values: ReadonlyArray<number>): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  let acc = 0;
  for (const v of values) acc += (v - m) * (v - m);
  return Math.sqrt(acc / (values.length - 1));
}

/**
 * Wilson score interval for a binomial proportion.
 *
 * @param passed number of successes
 * @param total  number of trials
 * @param z      normal quantile (default 1.96 = 95% two-sided)
 * @returns `{ lo, hi }` clamped to [0, 1]; `{ lo: 0, hi: 1 }` when `total` is 0
 *
 * @stable
 */
export function wilsonInterval(
  passed: number,
  total: number,
  z = 1.96,
): { readonly lo: number; readonly hi: number } {
  if (total <= 0) return { lo: 0, hi: 1 };
  const p = passed / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const centre = p + z2 / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total));
  return {
    lo: Math.max(0, (centre - margin) / denom),
    hi: Math.min(1, (centre + margin) / denom),
  };
}

const ITERATION_SUFFIX_RE = /-iter-\d+$/;

/**
 * Strip the `-iter-N` disambiguation suffix the runner appends under
 * `iterations > 1` (EB-6), recovering the base case id.
 *
 * @stable
 */
export function stripIterationSuffix(caseId: string): string {
  return caseId.replace(ITERATION_SUFFIX_RE, '');
}

/**
 * pass^k over per-iteration case outcomes: group by base case id and
 * report the fraction of base cases whose EVERY iteration passed.
 *
 * @param outcomes one entry per executed case iteration
 * @returns `k` = the largest group size observed, `baseCases` = number of
 *   distinct base cases, `value` = the pass^k fraction (0 when no cases)
 *
 * @stable
 */
export function passHatK(
  outcomes: ReadonlyArray<{ readonly caseId: string; readonly pass: boolean }>,
): { readonly k: number; readonly baseCases: number; readonly value: number } {
  const groups = new Map<string, { total: number; passed: number }>();
  for (const o of outcomes) {
    const base = stripIterationSuffix(o.caseId);
    const g = groups.get(base) ?? { total: 0, passed: 0 };
    g.total += 1;
    if (o.pass) g.passed += 1;
    groups.set(base, g);
  }
  if (groups.size === 0) return { k: 0, baseCases: 0, value: 0 };
  let k = 0;
  let allPass = 0;
  for (const g of groups.values()) {
    if (g.total > k) k = g.total;
    if (g.passed === g.total) allPass += 1;
  }
  return { k, baseCases: groups.size, value: allPass / groups.size };
}

/**
 * Result of {@link pairedPassSignificance}.
 *
 * @stable
 */
export interface PairedSignificance {
  /** Cases present in BOTH runs (the paired sample). */
  readonly pairs: number;
  /** baseline-pass -> current-fail count (the regressions). */
  readonly regressed: number;
  /** baseline-fail -> current-pass count (the improvements). */
  readonly improved: number;
  /**
   * Two-sided p-value from McNemar's test (continuity-corrected normal
   * approximation over the discordant pairs). `1` when there are no
   * discordant pairs - identical outcomes are never "significant".
   */
  readonly pValue: number;
}

/**
 * McNemar's paired test on per-case pass outcomes of two eval runs.
 * Only cases present in both maps are compared (by base case id).
 *
 * @stable
 */
export function pairedPassSignificance(
  current: ReadonlyMap<string, boolean>,
  baseline: ReadonlyMap<string, boolean>,
): PairedSignificance {
  let pairs = 0;
  let regressed = 0;
  let improved = 0;
  for (const [caseId, basePass] of baseline) {
    const curPass = current.get(caseId);
    if (curPass === undefined) continue;
    pairs += 1;
    if (basePass && !curPass) regressed += 1;
    else if (!basePass && curPass) improved += 1;
  }
  const discordant = regressed + improved;
  if (discordant === 0) return { pairs, regressed, improved, pValue: 1 };
  // Continuity-corrected normal approximation to the binomial(discordant, 0.5).
  const z = (Math.abs(regressed - improved) - 1) / Math.sqrt(discordant);
  const pValue = z <= 0 ? 1 : Math.min(1, 2 * (1 - normalCdf(z)));
  return { pairs, regressed, improved, pValue };
}

/**
 * Collapse per-iteration outcomes to per-base-case pass (a base case
 * passes when EVERY iteration passed) - the paired unit for
 * {@link pairedPassSignificance}.
 *
 * @stable
 */
export function passByBaseCase(
  outcomes: ReadonlyArray<{ readonly caseId: string; readonly pass: boolean }>,
): ReadonlyMap<string, boolean> {
  const out = new Map<string, boolean>();
  for (const o of outcomes) {
    const base = stripIterationSuffix(o.caseId);
    const prev = out.get(base);
    out.set(base, prev === undefined ? o.pass : prev && o.pass);
  }
  return out;
}

/** Standard normal CDF via the Abramowitz-Stegun 7.1.26 erf approximation. */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(x) / Math.SQRT2));
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}
