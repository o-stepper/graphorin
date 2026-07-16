---
'@graphorin/memory': patch
---

Fix exact dedup never firing without an embedder on the conflict pipeline (e2e 2026-07-13, MEMORY-C-02, major). Stage-1 exact dedup only compared the candidate against the vector-search candidate list, which is empty when no embedder is configured (or the vector extension is unavailable) - so byte-identical facts were both admitted in the documented offline default. When no vector candidates are surfaced, the pipeline now also gathers exact-text candidates through the store's FTS search (the same seam the consolidator uses via `findExactTextDuplicate`); stage 1 confirms exactness with its canonical-hash comparison, so only true duplicates dedup and the write path still degrades safely on any search failure. Regression test pins that a byte-identical duplicate is deduped with `embedder: null`.
