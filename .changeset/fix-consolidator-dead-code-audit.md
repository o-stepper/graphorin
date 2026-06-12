---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

MCON-17: consolidator hygiene + complete run audit.

- `consolidator_runs` now records `episodes_formed` / `insights_created`
  (migration 021) — the P1-2/P1-1 counters were computed on every phase
  outcome and then dropped at `recordRunFinish`, so the audit could not
  answer "did reflection actually produce anything?".
- `fireNow(...)` on a phase the tier disabled now actually warns (the
  old branch promised a warn and emitted nothing) while still
  proceeding — manual flushes bypass phase gating on purpose.
- The light phase stops re-reading the unconsumed message batch on
  every pass just to produce an advisory dropped-count nothing acted
  on; noise filtering lives where extraction consumes the batch. Dead
  code removed: `cursorTip` (computed and voided) and the
  caller-less `nextCursor` export.
