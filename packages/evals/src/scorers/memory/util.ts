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
 * Build the default matcher: token-set F1 at or above `minTokenF1`
 * (default `0.5`).
 *
 * @stable
 */
export function tokenF1Matcher(minTokenF1: number = 0.5): MemoryPointMatcher {
  return (gold, observed) => tokenF1(gold, observed) >= minTokenF1;
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
