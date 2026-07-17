-- Migration 038: durable suspended agent runs.
-- Owned by `@graphorin/server`. A run parked on durable HITL
-- (`awaiting_approval`) persists its serialized RunState here so
-- `POST /runs/:runId/resume` survives a server restart. Rows are
-- written on suspend, replaced on re-suspend, and deleted when the
-- run settles (resume completes/fails, or an explicit abort).

CREATE TABLE IF NOT EXISTS suspended_runs (
  run_id       TEXT PRIMARY KEY,
  agent_id     TEXT NOT NULL,
  session_id   TEXT,
  user_id      TEXT,
  state_json   TEXT NOT NULL,
  suspended_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suspended_runs_session
  ON suspended_runs(session_id);
