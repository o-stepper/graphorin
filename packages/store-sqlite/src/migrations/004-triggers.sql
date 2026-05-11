-- Phase 05 migration 004: durable trigger state. Same code path lib +
-- server (DEC-150). The `event` kind is persistent for parity; the
-- in-process queueing semantics may evolve post-MVP.

CREATE TABLE IF NOT EXISTS trigger_state (
  id                   TEXT PRIMARY KEY,
  kind                 TEXT NOT NULL,
  spec                 TEXT NOT NULL,
  callback_ref         TEXT NOT NULL,
  next_fire_at         INTEGER,
  last_fired_at        INTEGER,
  missed_fires         INTEGER NOT NULL DEFAULT 0,
  disabled             INTEGER NOT NULL DEFAULT 0,
  catchup_policy       TEXT NOT NULL DEFAULT 'none',
  max_catchup_runs     INTEGER NOT NULL DEFAULT 1,
  catchup_window_ms    INTEGER NOT NULL DEFAULT 86400000,
  tags_json            TEXT,
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER
);

CREATE INDEX IF NOT EXISTS idx_trigger_state_next_fire
  ON trigger_state(disabled, next_fire_at);
