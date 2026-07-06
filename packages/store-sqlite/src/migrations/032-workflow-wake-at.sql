-- W-032 migration 032: durable-timer enumeration for the polling driver.
--
-- The workflow engine now stamps CheckpointMetadata.wakeAt (the
-- earliest due frontier timer, epoch ms) on suspended checkpoints.
-- Persist it as a real column with a partial index so listSuspended
-- can enumerate due threads without parsing metadata tags.
--
-- Rows written before this migration have wake_at NULL: threads put to
-- sleep on an older version stay invisible to the driver until one
-- manual tick (or any resume) re-persists them - documented in the
-- migration notes.

ALTER TABLE workflow_checkpoints ADD COLUMN wake_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_workflow_checkpoints_wake
  ON workflow_checkpoints (namespace, status, wake_at)
  WHERE wake_at IS NOT NULL;
