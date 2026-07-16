-- 037: MEMORY-R-01 - drop '.' from the FTS5 tokenizer so a trailing
-- period (or any '.' at a token boundary) no longer glues onto the
-- preceding word.
--
-- The original tokenizer (migrations 001 / 014 / 028) declared
-- tokenchars '-_.@/', so 'Alex moved to Tbilisi.' indexed 'tbilisi.' as
-- a single token and a plain query for 'Tbilisi' never matched the
-- sentence-final word. In the offline default (no embedder configured)
-- the FTS leg is the only retrieval signal, so ordinary sentence-ending
-- facts, episodes, and messages were silently unrecallable. Removing '.'
-- from tokenchars makes it a token separator (unicode61's default), so
-- 'tbilisi' is indexed and the plain query hits. '@' and '/' stay
-- tokenchars, and phrase queries over emails / URLs still match because
-- their now-split tokens remain adjacent.
--
-- FTS5 cannot ALTER a tokenizer in place, so every affected shadow table
-- is rebuilt: its stored text is copied out (preserving the rowid, which
-- keys the join back to the base row, and - for facts_fts - the P1-3
-- contextual index text that lives only in the FTS row), the table is
-- dropped and recreated with the corrected tokenizer, and the text is
-- reinserted so it is re-tokenized under the new rules.

-- facts_fts (migration 001, column `text`).
CREATE TEMP TABLE _rebuild_facts_fts AS
  SELECT rowid AS rid, text AS body FROM facts_fts;
DROP TABLE facts_fts;
CREATE VIRTUAL TABLE facts_fts USING fts5(
  text,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_@/'"
);
INSERT INTO facts_fts (rowid, text)
  SELECT rid, body FROM _rebuild_facts_fts;
DROP TABLE _rebuild_facts_fts;

-- episodes_fts (migration 001, column `summary`).
CREATE TEMP TABLE _rebuild_episodes_fts AS
  SELECT rowid AS rid, summary AS body FROM episodes_fts;
DROP TABLE episodes_fts;
CREATE VIRTUAL TABLE episodes_fts USING fts5(
  summary,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_@/'"
);
INSERT INTO episodes_fts (rowid, summary)
  SELECT rid, body FROM _rebuild_episodes_fts;
DROP TABLE _rebuild_episodes_fts;

-- session_messages_fts (migration 001, column `text`).
CREATE TEMP TABLE _rebuild_session_messages_fts AS
  SELECT rowid AS rid, text AS body FROM session_messages_fts;
DROP TABLE session_messages_fts;
CREATE VIRTUAL TABLE session_messages_fts USING fts5(
  text,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_@/'"
);
INSERT INTO session_messages_fts (rowid, text)
  SELECT rid, body FROM _rebuild_session_messages_fts;
DROP TABLE _rebuild_session_messages_fts;

-- insights_fts (migration 014, column `text`).
CREATE TEMP TABLE _rebuild_insights_fts AS
  SELECT rowid AS rid, text AS body FROM insights_fts;
DROP TABLE insights_fts;
CREATE VIRTUAL TABLE insights_fts USING fts5(
  text,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_@/'"
);
INSERT INTO insights_fts (rowid, text)
  SELECT rid, body FROM _rebuild_insights_fts;
DROP TABLE _rebuild_insights_fts;

-- rules_fts (migration 028, column `text`).
CREATE TEMP TABLE _rebuild_rules_fts AS
  SELECT rowid AS rid, text AS body FROM rules_fts;
DROP TABLE rules_fts;
CREATE VIRTUAL TABLE rules_fts USING fts5(
  text,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_@/'"
);
INSERT INTO rules_fts (rowid, text)
  SELECT rid, body FROM _rebuild_rules_fts;
DROP TABLE _rebuild_rules_fts;
