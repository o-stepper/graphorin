---
'@graphorin/triggers': patch
---

Fix disabled triggers still firing via `emit()` / manual `fire()` (e2e 2026-07-16, TRIGGERS-01, minor). `fire()` honoured only the expiry check, not the persisted `disabled` flag, and `emit()` delegates to `fire()` - so an event trigger could not actually be paused (only the timer loop skipped disabled rows). `fire()` now short-circuits on every path when the trigger is disabled, checked against an in-memory `#disabled` mirror kept in sync at register / start / setDisabled / auto-pause / unregister (a per-fire `store.get()` would add latency to the hot path and reorder event emission). Regression test pins that a `setDisabled(true)` trigger fires on neither `emit()` nor `fire()`, and resumes after re-enabling.
