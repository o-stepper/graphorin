-- Phase 05 migration 001: memory tables (working blocks, session messages,
-- episodes, facts, rules, shared attachments) + per-record `embedder_id`
-- registry + resumable migration cursor.
--
-- Multi-table per-embedder vec0 tables are created lazily by
-- `vector-table-mgr` on first write per (entity, embedder_id) pair —
-- this migration only creates the registry rows and the FTS5 virtual
-- tables, which exist independently of the embedder.

CREATE TABLE IF NOT EXISTS embedding_meta (
  id              TEXT PRIMARY KEY,
  embedder_kind   TEXT NOT NULL,
  model           TEXT NOT NULL,
  dim             INTEGER NOT NULL,
  distance_metric TEXT NOT NULL DEFAULT 'cosine',
  config_hash     TEXT NOT NULL,
  vec_table_facts        TEXT NOT NULL,
  vec_table_episodes     TEXT NOT NULL,
  vec_table_messages     TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  retired_at      INTEGER NULL,
  notes           TEXT NULL
);

CREATE TABLE IF NOT EXISTS migration_state (
  id              TEXT PRIMARY KEY,
  source_embedder TEXT NOT NULL REFERENCES embedding_meta(id),
  target_embedder TEXT NOT NULL REFERENCES embedding_meta(id),
  strategy        TEXT NOT NULL,
  status          TEXT NOT NULL,
  total_records   INTEGER NOT NULL,
  processed       INTEGER NOT NULL DEFAULT 0,
  last_record_id  TEXT NULL,
  started_at      INTEGER NOT NULL,
  finished_at     INTEGER NULL,
  error_message   TEXT NULL
);

CREATE TABLE IF NOT EXISTS working_blocks (
  id               TEXT PRIMARY KEY,
  scope_user_id    TEXT NOT NULL,
  scope_session_id TEXT,
  scope_agent_id   TEXT,
  label            TEXT NOT NULL,
  description      TEXT,
  value            TEXT NOT NULL,
  char_limit       INTEGER NOT NULL,
  read_only        INTEGER NOT NULL DEFAULT 0,
  sensitivity      TEXT NOT NULL,
  tags_json        TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER,
  deleted_at       INTEGER,
  UNIQUE (scope_user_id, scope_session_id, scope_agent_id, label)
);

CREATE INDEX IF NOT EXISTS idx_working_blocks_scope
  ON working_blocks(scope_user_id, scope_session_id, scope_agent_id);

CREATE TABLE IF NOT EXISTS session_messages (
  id                TEXT PRIMARY KEY,
  scope_user_id     TEXT NOT NULL,
  scope_session_id  TEXT NOT NULL,
  scope_agent_id    TEXT,
  agent_id          TEXT,
  role              TEXT NOT NULL,
  content_json      TEXT NOT NULL,
  tool_calls_json   TEXT,
  tool_call_id      TEXT,
  user_message_id   TEXT,
  token_count       INTEGER,
  tokenizer_version TEXT,
  embedder_id       TEXT REFERENCES embedding_meta(id),
  sequence          INTEGER NOT NULL,
  created_at        INTEGER NOT NULL,
  deleted_at        INTEGER
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session
  ON session_messages(scope_session_id, sequence);
CREATE INDEX IF NOT EXISTS idx_session_messages_agent
  ON session_messages(scope_session_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_embedder
  ON session_messages(scope_user_id, embedder_id);

CREATE VIRTUAL TABLE IF NOT EXISTS session_messages_fts USING fts5(
  text,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_.@/'"
);

CREATE TABLE IF NOT EXISTS episodes (
  id                TEXT PRIMARY KEY,
  scope_user_id     TEXT NOT NULL,
  scope_session_id  TEXT,
  scope_agent_id    TEXT,
  summary           TEXT NOT NULL,
  started_at        INTEGER NOT NULL,
  ended_at          INTEGER NOT NULL,
  importance        REAL,
  embedder_id       TEXT REFERENCES embedding_meta(id),
  source_message_ids_json TEXT,
  sensitivity       TEXT NOT NULL,
  tags_json         TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER,
  deleted_at        INTEGER,
  archived          INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_episodes_user
  ON episodes(scope_user_id, embedder_id);
CREATE INDEX IF NOT EXISTS idx_episodes_session
  ON episodes(scope_session_id, started_at);

CREATE VIRTUAL TABLE IF NOT EXISTS episodes_fts USING fts5(
  summary,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_.@/'"
);

CREATE TABLE IF NOT EXISTS facts (
  id                TEXT PRIMARY KEY,
  scope_user_id     TEXT NOT NULL,
  scope_session_id  TEXT,
  scope_agent_id    TEXT,
  text              TEXT NOT NULL,
  subject           TEXT,
  predicate         TEXT,
  object            TEXT,
  confidence        REAL,
  sensitivity       TEXT NOT NULL,
  tags_json         TEXT,
  embedder_id       TEXT REFERENCES embedding_meta(id),
  source_message_ids_json TEXT,
  valid_from        INTEGER,
  valid_to          INTEGER,
  supersedes        TEXT,
  superseded_by     TEXT,
  strength          REAL NOT NULL DEFAULT 1.0,
  last_accessed_at  INTEGER,
  hash              TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER,
  deleted_at        INTEGER,
  archived          INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_facts_user
  ON facts(scope_user_id, embedder_id);
CREATE INDEX IF NOT EXISTS idx_facts_subject_predicate
  ON facts(scope_user_id, subject, predicate);
CREATE INDEX IF NOT EXISTS idx_facts_hash
  ON facts(scope_user_id, hash);

CREATE VIRTUAL TABLE IF NOT EXISTS facts_fts USING fts5(
  text,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_.@/'"
);

CREATE TABLE IF NOT EXISTS rules (
  id                TEXT PRIMARY KEY,
  scope_user_id     TEXT NOT NULL,
  scope_session_id  TEXT,
  scope_agent_id    TEXT,
  text              TEXT NOT NULL,
  condition         TEXT,
  priority          INTEGER NOT NULL DEFAULT 50,
  sensitivity       TEXT NOT NULL,
  tags_json         TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER,
  deleted_at        INTEGER
);

CREATE INDEX IF NOT EXISTS idx_rules_user
  ON rules(scope_user_id, priority DESC);

CREATE TABLE IF NOT EXISTS shared_attachments (
  record_id   TEXT NOT NULL,
  agent_id    TEXT NOT NULL,
  attached_at INTEGER NOT NULL,
  PRIMARY KEY (record_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_attachments_agent
  ON shared_attachments(agent_id, attached_at DESC);

CREATE TABLE IF NOT EXISTS memory_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_kind TEXT NOT NULL,
  memory_id   TEXT NOT NULL,
  prev_value  TEXT,
  new_value   TEXT,
  event       TEXT NOT NULL,
  source      TEXT NOT NULL,
  message_id  TEXT,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_history_target
  ON memory_history(memory_kind, memory_id, created_at);
