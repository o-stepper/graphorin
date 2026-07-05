---
'@graphorin/store-sqlite': minor
'@graphorin/cli': minor
---

W-065: lifecycle owners for four small tables. `SqliteConsolidatorStateStore` gains `pruneRuns(beforeEpochMs)` (terminal per-tick run-log rows; `status='running'` always survives) and `pruneExhaustedBatches(beforeEpochMs)` (DLQ batches parked forever with `next_retry_at IS NULL`; batches awaiting retry stay claimable). New CLI `graphorin consolidator dlq-list` / `dlq-clear` (`--exhausted-only` default true, `--before`, `--id`, `--user`) make the permanent `dead-letter queue: N` status warning actionable - operator-level, cross-user, in the same style as the existing `dlqSize` counter. `IdempotencyStore.prune`'s TSDoc now names its production caller (the server's hourly sweep). Migration 031 drops the dead `trigger_fire_log` table (created by 007, never written or read by any code; append-only discipline preserved - 007 untouched).
