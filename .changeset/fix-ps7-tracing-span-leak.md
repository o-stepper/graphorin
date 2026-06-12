---
'@graphorin/provider': patch
---

fix(provider): close the stream span when the consumer breaks early (PS-7)

`tracedStream` ended its span after the loop (success) or in `catch` (error).
A consumer that `break`s or returns early — the normal abort path for a
streaming UI — injects a generator `return` at the `yield`, so neither branch
ran and the span was never closed (a leak, no status).

`span.end()` now lives in a `finally`, so the span closes exactly once on every
exit: normal completion (status `ok`), error (status `error`, re-thrown), or
early abort (status left unset — it never completed).

Red-first: a counting-tracer test breaks after the first event and asserts
`span.end()` was called once, with no exception recorded and no `ok` status.
