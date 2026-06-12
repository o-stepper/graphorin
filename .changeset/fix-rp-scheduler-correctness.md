---
'@graphorin/triggers': patch
---

fix(triggers): scheduler correctness — duplicate interval fires, death-on-error, timeout overflow, false catch-up (RP-13 / RP-14 / RP-15 / RP-12)

Four verified scheduler bugs:

- **RP-13** — interval triggers fired **twice every period** from the second
  period on: the next fire was computed from the *previous* `lastFiredAt`
  (`prev + interval ≈ now` → clamped-to-0 delay → immediate duplicate). The
  next fire is now computed from the current fire's timestamp.
- **RP-14** — one callback error **permanently silenced** the trigger
  in-process: the one-shot timer was consumed and the catch never re-armed. The
  error path now recomputes + persists `nextFireAt` (without recording a
  successful fire — `lastFiredAt` stays put) and re-arms, so a daily cron
  survives a transient network failure.
- **RP-15** — delays beyond `2^31−1` ms (a quarterly cron, or a monthly one
  after a 31-day month) overflowed `setTimeout` — Node clamps to 1 ms, firing
  the callback in a **hot loop**. Long waits are now chunked through an
  intermediate wake-up that re-reads state and re-schedules, never fires.
- **RP-12** — catch-up fired **unconditionally** on every restart (`'last'`:
  once, `'all'`: exactly `maxCatchupRuns` times) without checking whether
  anything was actually missed, and interval triggers never participated. The
  scheduler now walks the schedule from the last successful fire and counts
  REAL misses: zero crossed boundaries → zero catch-up fires; `'last'` fires
  once iff ≥1 missed; `'all'` fires `min(missed, maxCatchupRuns)`; the excess
  is recorded in the previously-inert `missedFires` (read by server health +
  CLI). Intervals participate. Note the documented corollary:
  `catchupWindowMs` must exceed the trigger period for catch-up to be possible.
- Idle triggers no longer self-reschedule on fire (their next window starts
  only at `recordActivity()`) — a fire-driven re-arm computed a stale
  `lastActivity + idleMs`, clamped to 0 and refired in a loop.
