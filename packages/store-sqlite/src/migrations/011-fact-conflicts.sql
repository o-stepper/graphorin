-- Phase 10b migration 011: per-decision audit log written by the
-- multi-stage conflict resolution pipeline (DEC-117 / ADR-018 ext).
--
-- Every fact_remember(...) call lands a single row recording which
-- pipeline stage produced the decision, the candidate fact id, the
-- conflicting existing fact id (when applicable), the cosine
-- similarity that drove the choice (Stage 2 only), and a free-form
-- reason. The table feeds replay/debug tooling and the future
-- "graphorin audit conflicts" surface exposed by the CLI.

CREATE TABLE IF NOT EXISTS fact_conflicts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  scope_user_id   TEXT NOT NULL,
  candidate_id    TEXT NOT NULL,
  existing_id     TEXT,
  decision        TEXT NOT NULL,
  stage           TEXT NOT NULL,
  detection_zone  TEXT,
  similarity      REAL,
  reason          TEXT,
  detected_by     TEXT NOT NULL DEFAULT 'sync-write',
  detected_at     INTEGER NOT NULL,
  resolved_at     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_fact_conflicts_user_detected
  ON fact_conflicts(scope_user_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_fact_conflicts_candidate
  ON fact_conflicts(candidate_id);

CREATE INDEX IF NOT EXISTS idx_fact_conflicts_existing
  ON fact_conflicts(existing_id);
