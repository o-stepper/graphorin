-- Phase 05 migration 003: session metadata + agents registry +
-- handoffs + workflow-run mapping. The actual `session_messages`
-- rows are owned by migration 001 (single-source-of-truth principle —
-- the sessions package delegates message CRUD to memory).

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  agent_id    TEXT NOT NULL,
  title       TEXT,
  tags_json   TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER,
  closed_at   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_agent
  ON sessions(user_id, agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agents_registry (
  id            TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  registered_at INTEGER NOT NULL,
  retired_at    INTEGER,
  tags_json     TEXT,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS session_handoffs (
  id                       TEXT PRIMARY KEY,
  session_id               TEXT NOT NULL,
  from_agent_id            TEXT NOT NULL,
  to_agent_id              TEXT NOT NULL,
  step_number              INTEGER NOT NULL,
  reason                   TEXT,
  input_filter_kind        TEXT,
  input_filter_meta_json   TEXT,
  secrets_inheritance      TEXT,
  inherited_secrets_json   TEXT,
  secrets_override_reason  TEXT,
  at                       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_handoffs_session
  ON session_handoffs(session_id, at);

CREATE TABLE IF NOT EXISTS session_workflow_runs (
  session_id   TEXT NOT NULL,
  workflow_id  TEXT NOT NULL,
  thread_id    TEXT NOT NULL,
  status       TEXT NOT NULL,
  attached_at  INTEGER NOT NULL,
  PRIMARY KEY (session_id, workflow_id, thread_id)
);

CREATE TABLE IF NOT EXISTS session_audit (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL,
  action        TEXT NOT NULL,
  actor_kind    TEXT,
  actor_id      TEXT,
  actor_label   TEXT,
  metadata_json TEXT,
  at            INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_audit_session
  ON session_audit(session_id, at DESC);

CREATE INDEX IF NOT EXISTS idx_session_audit_at
  ON session_audit(at);
