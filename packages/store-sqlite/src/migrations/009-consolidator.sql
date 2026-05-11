-- Phase 05 migration 009: consolidator state, run history, and DLQ for
-- failed batches (DEC-133 / DEC-134). Owned by the memory consolidator
-- in Phase 10c; the schema is declared here so the migration runner
-- has a single ordered registry to apply.

CREATE TABLE IF NOT EXISTS consolidator_state (
  scope_user_id           TEXT NOT NULL,
  scope_session_id        TEXT,
  scope_agent_id          TEXT,
  last_processed_message_id TEXT,
  last_phase              TEXT,
  last_completed_at       INTEGER,
  next_eligible_at        INTEGER,
  active_lock_held_by     TEXT,
  active_lock_acquired_at INTEGER,
  PRIMARY KEY (scope_user_id, scope_session_id, scope_agent_id)
);

CREATE TABLE IF NOT EXISTS consolidator_runs (
  id                 TEXT PRIMARY KEY,
  scope_user_id      TEXT,
  scope_session_id   TEXT,
  trigger_kind       TEXT,
  phase              TEXT,
  started_at         INTEGER NOT NULL,
  finished_at        INTEGER,
  status             TEXT NOT NULL,
  llm_tokens_used    INTEGER NOT NULL DEFAULT 0,
  llm_cost_usd       REAL,
  facts_created      INTEGER NOT NULL DEFAULT 0,
  facts_updated      INTEGER NOT NULL DEFAULT 0,
  conflicts_resolved INTEGER NOT NULL DEFAULT 0,
  noise_filtered_count INTEGER NOT NULL DEFAULT 0,
  empty_extractions  INTEGER NOT NULL DEFAULT 0,
  error_message      TEXT,
  retry_count        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_consolidator_runs_scope
  ON consolidator_runs(scope_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_consolidator_runs_status
  ON consolidator_runs(status, started_at);

CREATE TABLE IF NOT EXISTS consolidator_failed_batches (
  id                  TEXT PRIMARY KEY,
  consolidator_run_id TEXT REFERENCES consolidator_runs(id),
  scope_user_id       TEXT,
  message_ids_json    TEXT NOT NULL,
  error_kind          TEXT,
  error_message       TEXT,
  failed_at           INTEGER NOT NULL,
  next_retry_at       INTEGER,
  retry_count         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_consolidator_dlq_retry
  ON consolidator_failed_batches(next_retry_at);
