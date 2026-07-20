/**
 * Shared matching helpers for the operation-level memory scorers.
 * LLM-written memory points rarely reproduce gold text verbatim, so
 * the default matcher compares normalised token sets by F1 instead of
 * string equality - deterministic (no judge call) and tunable via
 * `minTokenF1`. Callers with stricter needs supply their own
 * {@link MemoryPointMatcher}.
 *
 * @packageDocumentation
 */

/**
 * Decides whether an observed memory point expresses a gold point.
 *
 * @stable
 */
export type MemoryPointMatcher = (gold: string, observed: string) => boolean;

/**
 * Lowercase, strip punctuation to spaces, collapse whitespace and
 * split into tokens.
 *
 * @stable
 */
export function memoryPointTokens(text: string): ReadonlyArray<string> {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Token-set F1 between two texts in `[0, 1]`.
 *
 * @stable
 */
export function tokenF1(a: string, b: string): number {
  const aTokens = new Set(memoryPointTokens(a));
  const bTokens = new Set(memoryPointTokens(b));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }
  if (overlap === 0) return 0;
  return (2 * overlap) / (aTokens.size + bTokens.size);
}

/**
 * Build a symmetric matcher: token-set F1 at or above `minTokenF1`
 * (default `0.5`).
 *
 * @stable
 */
export function tokenF1Matcher(minTokenF1: number = 0.5): MemoryPointMatcher {
  return (gold, observed) => tokenF1(gold, observed) >= minTokenF1;
}

/**
 * Function words excluded from the gold side of
 * {@link goldTokenCoverage}. Copulas, articles, auxiliaries and bare
 * prepositions rarely survive an LLM's paraphrase (`is` becomes
 * `identifies as`), so counting them makes the coverage of a
 * three-token gold point swing on grammar instead of content.
 * Negation words are deliberately KEPT: stripping `not` would let
 * `does not like fish` cover `likes fish`.
 */
const GOLD_FUNCTION_TOKENS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'the',
  'am',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'do',
  'does',
  'did',
  'has',
  'have',
  'had',
  'will',
  'would',
  'shall',
  'should',
  'can',
  'could',
  'may',
  'might',
  'must',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'for',
  'with',
  'from',
  'as',
  'and',
  'or',
  'that',
  'this',
  'it',
  'its',
  's',
  't',
]);

/**
 * Directional containment: the fraction of the gold point's CONTENT
 * tokens (function words stripped) present in the observed text; `1`
 * means every content-bearing gold token appears. Falls back to the
 * full token set when stripping would leave nothing.
 *
 * Deep-retest 0.13.7 P2: symmetric {@link tokenF1} punishes verbosity
 * - gold `User is pescatarian` against the semantically correct `The
 * user started eating fish again on 2026-01-20, so the user
 * identifies as pescatarian.` scores F1 `0.235` and was graded missed
 * + hallucinated + omitted at once; its gold coverage is `1`.
 *
 * @stable
 */
export function goldTokenCoverage(gold: string, observed: string): number {
  const all = memoryPointTokens(gold);
  let content = all.filter((token) => !GOLD_FUNCTION_TOKENS.has(token));
  if (content.length === 0) content = [...all];
  const goldTokens = new Set(content);
  if (goldTokens.size === 0) return 0;
  const observedTokens = new Set(memoryPointTokens(observed));
  let covered = 0;
  for (const token of goldTokens) {
    if (observedTokens.has(token)) covered += 1;
  }
  return covered / goldTokens.size;
}

/**
 * Build a directional matcher: {@link goldTokenCoverage} at or above
 * `minGoldCoverage` (default `0.6`).
 *
 * @stable
 */
export function goldCoverageMatcher(minGoldCoverage: number = 0.6): MemoryPointMatcher {
  return (gold, observed) => goldTokenCoverage(gold, observed) >= minGoldCoverage;
}

/**
 * The operation scorers' default matcher: symmetric token F1 OR
 * directional gold coverage. F1 keeps short-vs-short matching strict;
 * the coverage leg stops verbose-but-correct memories from scoring as
 * missed, hallucinated, and omitted at once (deep-retest 0.13.7 P2).
 * Like every lexical matcher it cannot read negation or tense -
 * callers needing semantic matching supply their own
 * {@link MemoryPointMatcher} (an embedding or judge-backed one).
 *
 * @stable
 */
export function defaultMemoryPointMatcher(options?: {
  readonly minTokenF1?: number | undefined;
  readonly minGoldCoverage?: number | undefined;
}): MemoryPointMatcher {
  const byF1 = tokenF1Matcher(options?.minTokenF1);
  const byCoverage = goldCoverageMatcher(options?.minGoldCoverage);
  return (gold, observed) => byF1(gold, observed) || byCoverage(gold, observed);
}

/** True when some observed point matches the gold text. */
export function anyMatch(
  gold: string,
  observed: ReadonlyArray<string>,
  matcher: MemoryPointMatcher,
): boolean {
  return observed.some((candidate) => matcher(gold, candidate));
}

/** Truncated sample list for `ScoreResult.metadata` (keeps reports small). */
export function sampleList(items: ReadonlyArray<string>, max: number = 5): ReadonlyArray<string> {
  return items.slice(0, max).map((s) => (s.length > 120 ? `${s.slice(0, 120)}...` : s));
}
