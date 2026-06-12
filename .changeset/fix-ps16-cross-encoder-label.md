---
'@graphorin/reranker-transformersjs': patch
---

fix(reranker-transformersjs): read the positive label, not the max (PS-16)

`extractPairScores` collapsed a per-pair classifier array on the highest-scoring
label of *any* class, despite the docstring saying "highest-scoring positive
label". For a 2-label cross-encoder an irrelevant pair's most confident class is
the NEGATIVE one, so taking the max read negative confidence as relevance and
inverted the ranking. The default single-logit bge exports were unaffected; any
user-supplied 2-label model silently mis-ranked.

The array branch now prefers the POSITIVE label's score (`LABEL_1`, `positive`,
`relevant`, `entailment`, `true`, `yes` — matched as exact words so `irrelevant`
doesn't false-match `relevant`) and falls back to the top score only when no
label looks positive (single-logit / unrecognised labels).

Red-first: a `LABEL_0`/`LABEL_1` fixture where the irrelevant pair is confidently
negative scores low, and an `irrelevant`/`relevant` pair picks `relevant`.
