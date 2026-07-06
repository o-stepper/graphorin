---
'@graphorin/client': minor
---

The per-subscription client event buffer is bounded (W-152): when a slow `for await` consumer lets the queue reach `GraphorinClientOptions.subscriptionQueueLimit` (default 10000, 10x the server's per-connection default; `0` restores the old unbounded behavior), the subscription closes with the new typed `flow-overflow` `GraphorinClientErrorKind` - a deterministic error in the iterator instead of unbounded heap growth or silent frame loss, mirroring the server's queue-overflow close. Frames arriving after close no longer grow the dead queue, and `SubscriptionMetadata.queuedEvents` exposes the live buffer depth. The `@stable` error-kind union grows additively; exhaustive switches without a default branch must add the member.
