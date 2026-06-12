---
'@graphorin/memory': patch
---

MRET-13: recall-explanation fusion signals are keyed by retriever kind
(`rrf.fts_0`, `rrf.vector_0`, `rrf.hyde`, `rrf.graph`) instead of the
ephemeral `rrf.list_<index>` — list positions shifted whenever a leg
(vector / HyDE / graph) was conditionally absent from the fan-out, so
an X-3 explanation consumer could not tell what `list_3` was.
`ReRankOptions.labels` + a `labels` parameter on
`fuseRrf` / `fuseWeighted` (additive; unlabeled lists keep the
positional fallback).
