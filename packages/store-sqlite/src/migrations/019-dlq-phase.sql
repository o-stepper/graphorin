-- MCON-10 migration 019: persisted phase on `consolidator_failed_batches`.
-- The DLQ replay path used to infer the replay phase from `error_kind`
-- and the inference hard-coded 'standard' — a failed deep/reflection run
-- was "retried" by re-running extraction, which can never repair it.
-- This column records the phase that actually failed at enqueue time so
-- `drainDlq` replays the same phase. NULL ⇒ legacy row (replayed as
-- 'standard', matching the old behaviour).
ALTER TABLE consolidator_failed_batches ADD COLUMN phase TEXT;
