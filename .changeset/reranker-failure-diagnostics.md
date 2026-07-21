---
'@graphorin/reranker-llm': patch
---

Actionable failure diagnostics on `LlmReRanker` (thirteenth deep retest, P1). `lastErrorCount` alone said "something degraded" but diagnosing a live incident meant re-running billed calls. After each `rerank(...)`, `lastFailures` now holds per-passage detail - error class name, HTTP status when present, or the truncated off-format reply snippet - capped at 25 entries, and the new `lastOffFormatCount` counts unparseable replies separately from provider failures (`lastErrorCount` semantics unchanged). For live cloud usage, compose the provider with `withRetry` before handing it to `createLlmReranker`: the raw adapter retries nothing, so a cold `batchSize` burst can trip rate limits and degrade passages to the fallback score.
