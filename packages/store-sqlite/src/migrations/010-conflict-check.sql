-- Phase 05 migration 010: pending conflict-check rows for the
-- multi-stage conflict resolution pipeline (DEC-117 / ADR-018 ext).
-- Owned by the memory package (Phase 10b); the schema is declared here
-- so every Phase 05 migration step happens in one atomic startup pass.

CREATE TABLE IF NOT EXISTS conflict_check_pending (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  scope_user_id     TEXT NOT NULL,
  fact_id           TEXT NOT NULL,
  candidate_text    TEXT NOT NULL,
  stage             TEXT NOT NULL,
  reason            TEXT,
  enqueued_at       INTEGER NOT NULL,
  attempted_at      INTEGER,
  resolved_at       INTEGER,
  decision          TEXT
);

CREATE INDEX IF NOT EXISTS idx_conflict_check_pending_user
  ON conflict_check_pending(scope_user_id, resolved_at, enqueued_at);
