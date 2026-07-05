/**
 * PPR-lite graph scoring (D5) - damped spreading activation over the
 * entity-graph neighbourhood, generalizing the flat one-hop expansion.
 * Pure: given the seed facts (the lexical/vector candidates retrieved so
 * far) and the graded neighbours (`{ fact, depth }` from
 * `expandActivation`), it assigns each neighbour an activation score
 * that decays with hop distance, so a fact two hops from a strong seed
 * ranks below a direct neighbour instead of tying at a flat `1`.
 *
 * This is HippoRAG-style personalized-PageRank, "lite": a single damped
 * BFS pass seeded from retrieval rather than an iterative power method.
 * Seeding from query-matched entities (rather than retrieved candidates)
 * is the eval-gated extension the roadmap defers until numbers justify.
 *
 * @packageDocumentation
 */

/** Default damping applied per hop (activation × damping^depth). */
export const DEFAULT_PPR_DAMPING = 0.5;

/**
 * Compute PPR-lite activation for graded neighbours. `damping` in
 * `(0, 1]`; a neighbour at `depth` d contributes `damping^d` per seed
 * that reaches it. Since `expandActivation` already returns the MINIMUM
 * depth per neighbour (dedup across seeds), the score here is a pure
 * function of that min-depth - `damping^depth`, clamped to `[0, 1]`.
 * A neighbour list produced with `maxHops: 1` reproduces a flat-ish
 * score of `damping` at every node; `maxHops: 2` separates the tiers.
 *
 * @stable
 */
export function pprActivation(
  neighbours: ReadonlyArray<{ readonly depth: number }>,
  damping = DEFAULT_PPR_DAMPING,
): number[] {
  const d = damping <= 0 || damping > 1 ? DEFAULT_PPR_DAMPING : damping;
  return neighbours.map((n) => d ** Math.max(1, n.depth));
}
