---
'@graphorin/reranker-llm': patch
---

fix(reranker-llm): one failed provider call no longer collapses the rerank (PS-15)

`#scoreOne` had no try/catch around `provider.generate`, so a single 429 /
timeout rejected the whole `Promise.all` batch and `rerank()` threw — and since
semantic search doesn't wrap the reranker, a transient provider hiccup failed
the entire memory search when an LLM reranker was configured. Only unparseable
*responses* were handled.

Per-call provider failures are now caught and degraded to `fallbackScore` (the
same neutral score used for unparseable output); a deliberate `AbortError` is
re-thrown so cancellation still works. A new `lastErrorCount` getter exposes how
many passages were degraded on the last rerank for observability.

Red-first: a stub provider throws `429` for one passage — the rerank still
returns both hits with the healthy one scored and the failed one at fallback —
plus a test that an `AbortError` mid-scoring still propagates.
