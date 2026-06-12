---
'@graphorin/memory': patch
---

MRET-5 / MST-7: episodic FTS relevance is graduated again. The store
returns `score = -bm25(...)` (always positive for a match), so the old
`1 / (1 + max(0, -score))` normalisation collapsed every lexical hit to
exactly 1.0 — the DEC-105 triple-signal ranking silently degraded to
recency + importance. The new saturating ratio
`score / (score + 1)` orders stronger lexical matches above weaker ones.
