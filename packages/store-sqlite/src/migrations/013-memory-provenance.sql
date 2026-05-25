-- P1-4 migration 013: memory provenance + quarantine.
--
-- Tags every fact / episode with where it came from (`provenance`) and
-- a retrieval-trust state (`status`). Derived writes (consolidator
-- extraction, reflection) and injection-flagged candidates land
-- `status = 'quarantined'` and are excluded from default recall until
-- explicitly validated; quarantine is a retrieval gate, never a delete,
-- so quarantined rows remain fully auditable. Additive columns with
-- safe defaults — every pre-existing row reads back as `active` with a
-- NULL (first-party) provenance, so default reads are unchanged.

ALTER TABLE facts    ADD COLUMN provenance TEXT;                          -- 'user'|'tool'|'extraction'|'reflection'|'imported'
ALTER TABLE facts    ADD COLUMN status     TEXT NOT NULL DEFAULT 'active'; -- 'active'|'quarantined'
ALTER TABLE episodes ADD COLUMN provenance TEXT;
ALTER TABLE episodes ADD COLUMN status     TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_facts_status
  ON facts(scope_user_id, status);
CREATE INDEX IF NOT EXISTS idx_episodes_status
  ON episodes(scope_user_id, status);
