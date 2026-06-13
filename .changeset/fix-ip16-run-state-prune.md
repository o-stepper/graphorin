---
'@graphorin/server': minor
---

fix(server): periodically prune terminal run records (IP-16)

`RunStateTracker.prune()` existed but was never called, so every run, stream,
and workflow left a `RunRecord` — each holding an `AbortController` — in the
tracker's map forever: an unbounded memory leak on a long-living server.

`createServer().start()` now schedules a periodic sweep via the new exported
`scheduleRunPruning(runs, now, opts?)` helper (defaults: every 60s, 5-minute
terminal-record retention) and clears it in `stop()`. The timer is `unref`-ed
so it never keeps the process alive; active (`pending` / `running`) runs are
never touched. Red-first tests use fake timers to assert old terminal records
are pruned, active runs are kept, and the returned stop function halts the
sweep.
