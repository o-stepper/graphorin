---
'@graphorin/triggers': minor
---

Scheduler harness for proactive task fleets: opt-in `limits` on `createScheduler` (interval/idle period floor, default 60s, plus a declaration cap) enforced fail-fast at `register(...)` via the new `TriggerLimitError`; per-declaration `jitterMs` (deterministic per-id offset applied to the armed delay only, stable across restarts) and `expiresAt` (auto-pause past expiry: non-destructive disabled flag, WARN, and a new `'expired'` scheduler event). Without `limits` the scheduler behaves exactly as before.
