---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

MRET-8: decay re-ranking now runs over the FULL fused candidate pool
before the final `topK` cut — a fresh fact sitting just past the page
boundary pre-decay can actually enter the final page (previously decay
only re-sorted within the already-cut top-K). The per-search decay read
is now a narrow `listDecaySignals(ids)` (new optional store method,
implemented by the sqlite adapter) instead of re-reading the scope's
1000 oldest rows on every query — which was O(scope) per search AND,
being the LRU head, could miss the hits entirely.
