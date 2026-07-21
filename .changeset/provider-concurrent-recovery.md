---
'@graphorin/provider': patch
---

Twelfth external deep retest, P1: unsupported-parameter recovery is now concurrency-safe. The recovery predicates used to consult the live shared learned state, so in a cold concurrent batch (the LLM reranker fires `batchSize` parallel requests) only the first sibling to process its HTTP 400 retried - every other one saw the already-flipped state, forfeited its own retry, and surfaced the 400 (observed live as a silent fallback-score with `lastErrorCount=1`). Each attempt now records what it actually sent (token-limit spelling, temperature, `reasoning_effort: 'none'`) and recovers based on that snapshot, bounded by a per-call ledger; the instance still learns and warns exactly once, and retries pick up whatever a concurrent sibling learned in the meantime.
