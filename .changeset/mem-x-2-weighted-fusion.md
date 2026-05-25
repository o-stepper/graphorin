---
'@graphorin/memory': patch
---

X-2 — weighted/convex fusion + reranker guidance (see
`memory-improvement-proposals.md` §5, summary-table row **X-2 · Weighted fusion
+ reranker guidance**). RRF is a good zero-tuning default, but once labels exist
(the `@graphorin/evals` harness from P0-1) a calibrated weight can beat it. This
adds an opt-in weighted score fusion alongside RRF and documents when to reach
for the cross-encoder reranker. All changes are additive ⇒ `patch` (pre-1.0);
no core, store, or migration changes.

- **`fuseWeighted(lists, weights, k)`** in `@graphorin/memory/search` — a pure
  generalization of `fuseRrf`: each list `i` contributes `weights[i] · 1/(k +
  rank)`. A `weights` of `undefined` (or all-`1`) is byte-for-byte identical to
  `fuseRrf` (`fuseRrf` now delegates to it), and a missing / non-finite /
  negative entry falls back to the neutral `1`, so a partial or malformed
  `weights` never throws or poisons the ranking. `WeightedRRFReranker` wraps it
  as a `ReRanker` (id `'weighted-rrf'`) so weighted fusion can also be a default
  via `createMemory({ reranker })` / `setReranker(...)`.
- **`SemanticMemory.search` gains `fusion?: FusionStrategy`.** Omitted (the
  default) — or `{ strategy: 'rrf' }` — fuses through the configured reranker,
  unchanged. `{ strategy: 'weighted', weights: { fts?, vector? }, k? }` fuses
  through `WeightedRRFReranker`, weighting each candidate list by its retriever
  *kind* (FTS vs vector; the HyDE list counts as vector) so the weights survive
  the P2-3 multi-query fan-out. At equal weights it reproduces RRF end to end.
  The span `reranker_id` reflects the per-call reranker (`weighted-rrf` when
  used); no query / weight text is added to traces.
- **Reranker guidance** in the package README: cross-encoder reranking
  (`@graphorin/reranker-transformersjs` / `-llm`) pays off only on an
  already-high-recall candidate set — fix recall first (contextual retrieval /
  multi-query), then rerank a wider `candidateTopK`.

Weighted fusion is a calibration tool, not a new default — reserve it for
callers who have tuned the weights against labels; RRF remains the offline
zero-config default.
