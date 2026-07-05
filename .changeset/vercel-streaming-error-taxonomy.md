---
'@graphorin/provider': minor
---

W-023: the vercel adapter's streaming errors join the canonical taxonomy; transient failures become retryable/fallback-eligible.

The AI SDK never throws from `streamText()` synchronously - 429/500/529 arrive as in-band `{type:'error'}` chunks, which the adapter mapped to an inert `kind: 'unknown'` after an eagerly-emitted `stream-start`, so `withRetry` could never restart (PS-1), `withFallback` never switched, and the agent fallback chain treated the failure as ineligible: a transient 529 on a streaming step failed the whole run. Now: `stream-start` is deferred until the first REAL mapped event; an error chunk BEFORE any content THROWS a typed `ProviderHttpError` (status/errorKind/headers lifted from the chunk - pre-content 429/529 retry and fall back, with `retry-after` honoured); abort-shaped error chunks finish as `'aborted'` (never retried); a MID-stream error chunk yields a classified `ProviderErrorKind` (so the agent's per-step fallback acts on rate-limit/capacity) and the stream finishes with `finishReason: 'error'` instead of a synthetic `'stop'` with zero usage (PS-4 parity). BREAKING for consumers that relied on a yield-first error event for a first-chunk failure or on `stream-start` always preceding the throw.
