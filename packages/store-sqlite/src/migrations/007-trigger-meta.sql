-- Phase 05 migration 007: trigger fire log (per-fire audit row).
-- Distinct from `trigger_state` so the working row stays narrow while
-- a fire history is retained for `graphorin triggers status` (Phase 15).

CREATE TABLE IF NOT EXISTS trigger_fire_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger_id    TEXT NOT NULL,
  fired_at      INTEGER NOT NULL,
  outcome       TEXT NOT NULL,
  duration_ms   INTEGER,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_trigger_fire_log_trigger
  ON trigger_fire_log(trigger_id, fired_at DESC);
