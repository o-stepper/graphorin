---
'@graphorin/memory': minor
---

MCON-7 / MCON-8: the consolidator's per-phase model knobs are
implement-or-delete'd.

- NEW `cheapProvider` / `deepProvider` on `CreateConsolidatorOptions`
  (and `createMemory({ consolidator })`): the standard phase
  (extraction / episode / reconcile / situating-context) routes to
  `cheapProvider ?? provider`; the deep judge and the reflection pass
  route to `deepProvider ?? provider`. The `cheapModel` / `deepModel`
  strings are now honestly documented as telemetry-only labels — the
  old "null disables" claim was false.
- `cooldownMs` is ENFORCED: the runtime always persisted
  `nextEligibleAt = now + cooldownMs` but never read it. Trigger-driven
  dispatches (`turn`/`idle`/`cron`/`event`/`budget`) inside the window
  now defer with reason `'cooldown'`; manual `fireNow(...)` and DLQ
  replays bypass it. Checked once per dispatch, so phases within one
  trigger still chain.
- `maxConcurrentRuns` is honestly documented as advisory (the per-scope
  lock serializes runs); the never-read `budgetAttribution` option is
  REMOVED.
