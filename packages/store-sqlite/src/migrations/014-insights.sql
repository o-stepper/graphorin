-- P1-1 migration 014: reflection insights.
--
-- The consolidator's reflection pass (deep phase) synthesizes
-- higher-order `insight` records over recent memories and persists them
-- here. Every insight carries mandatory citations (`cites_json` — the
-- ids of the supporting memories it was synthesized from) so it can be
-- traced back to evidence ("trustworthy reflection"). Insights are
-- *derived*, so they default to `provenance = 'reflection'` and
-- `status = 'quarantined'` (P1-4) — excluded from action-driving recall
-- until validated. An ExpeL-style `salience` counter (new insights
-- start at 2) drives the forgetting loop; pruning is a soft-delete
-- (`deleted_at`), never a hard purge, so the audit trail survives.
--
-- Search is FTS5-only (no per-embedder vec0 table): insights are a soft,
-- rank-capped inspector surface, not primary recall, so this migration
-- deliberately avoids the `embedding_meta` vec-table plumbing. The
-- nullable `embedder_id` records the embedder context active at write
-- time for forward compatibility.

CREATE TABLE IF NOT EXISTS insights (
  id                TEXT PRIMARY KEY,
  scope_user_id     TEXT NOT NULL,
  scope_session_id  TEXT,
  scope_agent_id    TEXT,
  text              TEXT NOT NULL,
  cites_json        TEXT NOT NULL DEFAULT '[]',   -- JSON array of supporting memory ids
  salience          INTEGER NOT NULL DEFAULT 2,
  provenance        TEXT NOT NULL DEFAULT 'reflection',
  status            TEXT NOT NULL DEFAULT 'quarantined', -- 'active'|'quarantined'
  embedder_id       TEXT REFERENCES embedding_meta(id),
  sensitivity       TEXT NOT NULL DEFAULT 'internal',
  tags_json         TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER,
  deleted_at        INTEGER
);

CREATE INDEX IF NOT EXISTS idx_insights_user
  ON insights(scope_user_id, status);

CREATE VIRTUAL TABLE IF NOT EXISTS insights_fts USING fts5(
  text,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_.@/'"
);
