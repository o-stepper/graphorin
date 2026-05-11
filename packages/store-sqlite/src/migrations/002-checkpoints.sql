-- Phase 05 migration 002: workflow checkpoints + per-task pending writes.
-- Owned by `@graphorin/workflow`; the table layout reflects the
-- `CheckpointStore` contract from `@graphorin/core`.

CREATE TABLE IF NOT EXISTS workflow_checkpoints (
  id                TEXT PRIMARY KEY,
  thread_id         TEXT NOT NULL,
  namespace         TEXT NOT NULL,
  parent_id         TEXT,
  state_json        TEXT NOT NULL,
  channel_versions_json TEXT NOT NULL,
  step_number       INTEGER NOT NULL,
  source            TEXT NOT NULL,
  status            TEXT NOT NULL,
  node_name         TEXT,
  tags_json         TEXT,
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_checkpoints_thread
  ON workflow_checkpoints(thread_id, namespace, step_number DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_checkpoints_status
  ON workflow_checkpoints(thread_id, status);

CREATE TABLE IF NOT EXISTS workflow_pending_writes (
  thread_id     TEXT NOT NULL,
  namespace     TEXT NOT NULL,
  checkpoint_id TEXT NOT NULL,
  task_id       TEXT NOT NULL,
  write_index   INTEGER NOT NULL,
  channel       TEXT NOT NULL,
  value_json    TEXT NOT NULL,
  PRIMARY KEY (thread_id, namespace, checkpoint_id, task_id, write_index)
);
