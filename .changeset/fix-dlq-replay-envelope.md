---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

MCON-10: `drainDlq` replays now run through the full consolidator
envelope and target what actually failed.

- Replays go through the same path as every other run: budget precheck,
  scope lock, and `consolidator_runs` records (trigger
  `manual:dlq-replay:<phase>`) — they can no longer race a live run,
  spend past a pause, or stay invisible to the audit surface. A
  lock-deferred / paused replay is rescheduled WITHOUT consuming a
  retry.
- The failed phase is persisted on the DLQ row (migration 019,
  `consolidator_failed_batches.phase`) and replayed verbatim — the old
  `inferReplayPhase` hard-coded `'standard'`, so a failed deep run was
  "retried" by re-running extraction. Legacy rows without a phase keep
  the old standard replay.
- DLQ rows now capture the `messageIds` of the slice that failed
  instead of `[]`, so replays can be audited against the real window
  (the cursor may move on before the replay fires).
- A failed replay no longer enqueues a fresh DLQ row (the original row
  already tracks the failure) — previously fixing this would have
  multiplied rows per drain.
