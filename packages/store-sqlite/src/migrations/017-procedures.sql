-- P2-2 migration 017: induced-procedure fields on `rules`. The procedural
-- tier could store author-defined "how to do things" since migration 001,
-- but nothing *learned* them. AWM-style workflow induction
-- (@graphorin/memory) distils a reusable procedure — goal + value-abstracted
-- step sequence + success criteria — from a *successful* agent trajectory
-- and stores it here as a procedural rule. The structured payload rides on
-- the existing `rules` row (an induced procedure IS a procedural rule with
-- extra structure), so this is five additive nullable columns, not a new
-- table. Existing rows read back as NULL ⇒ undefined ⇒ plain rules,
-- unchanged.

-- The induced step sequence, JSON-encoded (`["search for {product}", ...]`).
-- NULL on author-defined rules.
ALTER TABLE rules ADD COLUMN steps_json TEXT;

-- Variable names abstracted from the trajectory's concrete values,
-- JSON-encoded (`["product", "quantity"]`). NULL on author-defined rules.
ALTER TABLE rules ADD COLUMN variables_json TEXT;

-- Voyager-style verifiable success criteria, JSON-encoded. NULL on
-- author-defined rules.
ALTER TABLE rules ADD COLUMN success_criteria_json TEXT;

-- Trust-provenance tag (P1-4). 'induction' for induced procedures; NULL on
-- author-defined rules (treated first-party).
ALTER TABLE rules ADD COLUMN provenance TEXT;

-- Retrieval-trust state (P1-4). 'quarantined' for induced procedures so they
-- never drive actions until validated; NULL on author-defined rules (treated
-- 'active').
ALTER TABLE rules ADD COLUMN status TEXT;
