---
'@graphorin/memory': patch
---

fix(memory): default auto-recall threshold to 0 so it actually injects (CE-4)

`factsAutoRecall`'s score threshold defaulted to `0.7`, but the default RRF
reranker fuses the FTS + vector candidate lists as `1/(60 + rank)` per list, so
fused scores top out near `2/(60 + 1) ≈ 0.033` — mathematically unable to reach
0.7. An operator who enabled `factsAutoRecall: { topK: N }` therefore got **zero**
facts injected on every turn, while `assemble` still reported
`autoRecall.factsTriggered: true` — a silent failure.

The default is now `0` (rank-based `topK` already bounds the injected volume),
and the `threshold` JSDoc documents that its scale is reranker-dependent so
operators calibrate against a known scale rather than a guess. Adds an
auto-recall test that uses the **default** threshold and asserts facts are
injected.
