---
'@graphorin/memory': minor
'@graphorin/store-sqlite': patch
---

MCON-9: the deep phase no longer re-bills poisoned conflict rows
forever and now honours a mid-run budget pause.

- A judge call that throws or returns unparseable output stamps
  `attempted_at` on the pending row (new `markAttempted` on the
  conflict store); the next failure closes the row with the new
  `'judge-unparseable'` decision — a poisoned row costs at most two
  calls across all runs instead of one per deep run forever.
- The judge loop checks `budget.snapshot().paused` at the top of each
  iteration (mirroring the standard/reflection phases), so tripping the
  daily ceiling mid-run stops spending instead of draining up to
  `maxDeepConflictsPerRun` further calls.
