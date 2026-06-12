---
'@graphorin/tools': minor
'@graphorin/agent': patch
---

fix(tools): spill artifacts get a lifecycle — per-run clear + TTL sweep (TL-10)

Spill artifacts (raw, pre-sanitization tool bodies) were written to
`<os.tmpdir()>/graphorin-spill/<runId>/` and never deleted — unbounded,
indefinite accumulation of unsanitized output.

- `SpillWriter` gains optional `clear(runId)` and `sweep(ttlMs)`; the
  default writer implements both (with a root-escape guard on `clear`) and
  fires one best-effort 7-day sweep at construction to collect orphans
  from crashed processes. `createDefaultSpillWriter` accepts
  `{ root, startupSweepTtlMs }`.
- The agent deletes a run's artifacts when the run ends `completed` or
  `failed`; `awaiting_approval` and `aborted` runs keep theirs so result
  handles survive resume.
