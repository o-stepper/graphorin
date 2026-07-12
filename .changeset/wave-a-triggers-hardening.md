---
'@graphorin/triggers': minor
'@graphorin/server': minor
---

Triggers hardening (W-123 + W-124). Scheduler: persisted rows without a re-registered declaration are surfaced at `start()` with a WARN and a new `orphaned` scheduler event instead of being skipped silently, and `Scheduler.orphans()` lists them; register-time catch-up is deferred to `start()` so user callbacks never fire on a not-started scheduler. Cron: new `timezone` option (IANA, validated eagerly) evaluates the expression against the zone's wall clock with Vixie DST semantics - fixed-time jobs swallowed by a spring-forward gap run once immediately after the transition and fall-back repeats run only on the first pass, while wildcard minute/hour jobs follow the new wall clock without compensation; `isValidTimeZone` is exported. Server: `POST /v1/triggers/prune` accepts `{ disabled?: boolean = true, orphaned?: boolean = false }` and reports per-bucket removals; the triggers daemon status gains an `orphaned` count.
