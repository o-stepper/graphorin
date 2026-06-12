---
'@graphorin/agent': minor
---

feat(agent): one in-flight run per Agent instance (AG-11)

`pendingSteer`, `pendingAbort`, `abortController`, `activeRunState` and the
executor bridge live at instance scope, and the public surface (`steer` /
`followUp` / `abort` / `compact`) addresses "the run" without a run handle —
so two overlapping runs on one instance silently shared and corrupted each
other's state, and a `steer()` issued near the end of a run leaked into the
next, possibly unrelated, run.

- A second concurrent `run()` / `stream()` now rejects with the new
  `ConcurrentRunError` (`code: 'concurrent-run'`). Use separate agent
  instances (or `fanOut`) for parallel work.
- Run-scoped state is reset at run entry: stale steers/aborts queued between
  runs are dropped instead of leaking in.
- The active-run reference is cleared on EVERY exit path (completed, failed,
  aborted, suspended, abandoned stream) via a wrapper `finally` — previously
  only the happy path cleared it, leaving `compact()` requests to hang
  forever after a failed run.
