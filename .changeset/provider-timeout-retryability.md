---
'@graphorin/provider': minor
'@graphorin/provider-llamacpp-node': minor
---

Unified provider recovery semantics. One exported retryability classification - `isRetryableProviderFailure(err)` - now backs both `withRetry` and `withFallback` (previously two hand-maintained copies), and the `Retry-After` reader is exported as `readRetryAfterMs(err)`; `ProviderHttpError` stamps a first-class `retryAfterMs` when the response carried a numeric `Retry-After` header. The timeout story now covers all five adapters: `vercelAdapter` gains an opt-in `timeoutMs` (bounds time to the first stream chunk, or the whole `generate()` call) and `llamaCppNodeAdapter` gains an opt-in `timeoutMs` (bounds time to the first token, model load included) - both surface expiry as the same retryable `ProviderHttpError{ status: 0 }` shape the HTTP adapters throw, never as a silent abort. The shared deadline primitive is exported as `createRequestTimeout` for custom adapter authors.
