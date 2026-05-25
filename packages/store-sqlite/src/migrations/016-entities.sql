-- P2-1 migration 016: the canonical-entity substrate for the lightweight
-- in-SQLite relation graph. The s/p/o columns on `facts` (live since
-- migration 001) become a graph once their subject/object strings are
-- resolved to canonical entities here; one-hop expansion then traverses
-- `fact_entities` with a recursive CTE. No graph DB — a
-- `facts(subject, predicate, object)` table *is* a graph in SQLite.

-- Canonical entities. The entity resolver (@graphorin/memory) folds
-- aliases ("Anna" / "Anna S." / "my sister") into one row via lexical +
-- embedding similarity. `embedding` is the entity-name vector stored as a
-- raw Float32 BLOB (NOT a vec0 table) — entity counts per user are small,
-- so the resolver compares candidates in-process, keeping the dedup path
-- offline and free of the native vec extension.
CREATE TABLE IF NOT EXISTS entities (
  id                TEXT PRIMARY KEY,
  scope_user_id     TEXT NOT NULL,
  name              TEXT NOT NULL,
  normalized_name   TEXT NOT NULL,
  embedding         BLOB,
  embedder_id       TEXT REFERENCES embedding_meta(id),
  -- Canonical pointer for append-only, reversible merges. NULL ⇒ this
  -- entity is a root; otherwise it points (single-level, by the
  -- resolver's invariant) at the surviving entity it was merged into.
  -- Merged rows are never deleted, so a merge is fully reversible.
  merged_into       TEXT REFERENCES entities(id),
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER
);

-- Exactly one *root* entity per normalized name per user (the canonical
-- uniqueness invariant). Merged (non-root) rows keep their normalized
-- name and are excluded from the constraint by the partial WHERE.
CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_canonical
  ON entities(scope_user_id, normalized_name)
  WHERE merged_into IS NULL;
CREATE INDEX IF NOT EXISTS idx_entities_merged_into
  ON entities(merged_into);
CREATE INDEX IF NOT EXISTS idx_entities_scope
  ON entities(scope_user_id);

-- Many-to-many mapping of a fact's subject / object to canonical
-- entities. `role` is 'subject' | 'object' (the predicate is a relation
-- label, never an entity). Append-only: a fact links to the entity that
-- was canonical at resolve time; later merges are followed via
-- `entities.merged_into` at read time, so these rows are never rewritten.
CREATE TABLE IF NOT EXISTS fact_entities (
  fact_id      TEXT NOT NULL REFERENCES facts(id),
  entity_id    TEXT NOT NULL REFERENCES entities(id),
  role         TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (fact_id, entity_id, role)
);
CREATE INDEX IF NOT EXISTS idx_fact_entities_entity
  ON fact_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_fact_entities_fact
  ON fact_entities(fact_id);

-- Append-only audit ledger for entity merges / unmerges. The
-- `entities.merged_into` pointer is the live state; this table is the
-- reversible history (who merged into whom, when, and why) that makes
-- merges auditable per the append-only ethos.
CREATE TABLE IF NOT EXISTS entity_merges (
  id              TEXT PRIMARY KEY,
  scope_user_id   TEXT NOT NULL,
  kind            TEXT NOT NULL,            -- 'merge' | 'unmerge'
  from_entity_id  TEXT NOT NULL,
  into_entity_id  TEXT,                     -- NULL for an unmerge
  reason          TEXT,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entity_merges_scope
  ON entity_merges(scope_user_id, created_at);
