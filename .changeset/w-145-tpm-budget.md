---
'@graphorin/provider': minor
---

`withRateLimit` gains an optional `tokensPerMinute` budget alongside RPM (W-145): for agentic workloads the binding provider limit is TPM, and a 150k-token compacted transcript used to occupy the same single slot as a 200-token reranker call. Each request now reserves its estimated token weight (default heuristic `ceil(textChars/4) + maxTokens`, or a pluggable `estimateTokens` - wire `createDefaultCounter` for provider-accurate weights) from a second bucket whose capacity is the full minute budget. Throw mode reports the max of the RPM/TPM waits in `retryAfterMs`; queue mode grants FIFO only when both dimensions fit, with over-budget weights clamped to the bucket capacity so a huge request degrades to "wait for a full bucket" instead of deadlocking the queue. Without the option, behaviour is byte-identical to the RPM-only limiter.
