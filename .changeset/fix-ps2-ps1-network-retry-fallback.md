---
'@graphorin/provider': patch
---

fix(provider): retry/fail-over network errors; don't restart yielded streams (PS-2, PS-1)

**PS-2 — network errors were never retried or failed over.** A fetch-level
failure wraps as `ProviderHttpError{ status: 0 }`, but `defaultRetryable` and
`defaultShouldFallback` only accepted transient/rate-limit/capacity kinds or
429/5xx — `status: 0` fell through to `false`. The documented headline
scenario (a local provider down with ECONNREFUSED → fail over to the next)
never fired. Worse, the vercel adapter wrapped **every** `generateText` /
`streamText` rejection as `status: 0`, so even real cloud 429/5xx became
status-0 and the 5xx/429 retry path was dead for the cloud too.

- Both default predicates now treat `status: 0` as retryable and
  fallback-eligible, while excluding aborts: a new shared `isAbortError`
  walks the `cause` chain for `AbortError` / `ABORT_ERR`, so an aborted
  request is never retried/failed-over even though it surfaces as status 0.
- The vercel adapter lifts the real `statusCode` from the AI SDK error
  (`statusFromCause`), so genuine 429/5xx reach the predicates.

**PS-1 — withRetry restarted streams that had already emitted.** A retryable
failure mid-stream re-ran `next.stream(req)` from scratch, replaying
stream-start and already-delivered text/tool-call events into the same
consumer iteration (duplicate output, potential double tool execution).
`retryingStream` now tracks a stream-level `yieldedAny` and rethrows once any
event has reached the consumer — mirroring `withFallback`. Pre-yield failures
still retry.

Red-first tests cover: status-0 retry + fail-over, abort-cause exclusion, the
mid-stream no-restart invariant (with a retryable 503), pre-yield retry, and
the vercel statusCode lift for 429/503.
