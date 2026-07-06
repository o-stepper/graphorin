---
'@graphorin/server': minor
---

The server workflow surface exposes every D1 primitive over HTTP (W-119). `POST /:id/resume` accepts an optional `name` that routes through `resolveAwakeable` (targeting one of several parallel awakeables/approvals); new `POST /:id/retry` (background replay of a failed/aborted thread) and `POST /:id/tick` (synchronous due-timer firing with `{fired, nextWakeAt}`) under `workflows:resume:<id>`; `POST /:id/fork` performs a REAL fork (the periphery-01 honest 501 retires) returning `201 { newThreadId }`, defaulting to the thread's latest checkpoint. `ServerWorkflowLike` gains the optional `retry/tick/resolveAwakeable/fork` methods and an `opts.signal` third parameter on `resume`; background resume/retry now receive the run tracker's AbortSignal so `runs.abort(runId)` actually cancels them.
