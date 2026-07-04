-- D3 migration 028: lexical index over procedural rules (runbook recall).
--
-- Rules could only ever be matched by their activation predicate
-- ('always' / 'topic=' / 'tag='); a "find the procedure for this task"
-- runbook lookup needs content search over the rule text (which for an
-- induced procedure embeds the title + numbered steps). Mirrors the
-- facts_fts setup: an FTS5 shadow table keyed by rowid, maintained by the
-- write path, joined back to `rules` so soft-deleted rows are filtered by
-- the join. Existing rows are backfilled so pre-migration procedures are
-- immediately searchable.

CREATE VIRTUAL TABLE IF NOT EXISTS rules_fts USING fts5(
  text,
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_.@/'"
);

INSERT INTO rules_fts (rowid, text)
  SELECT rowid, text FROM rules WHERE deleted_at IS NULL;
