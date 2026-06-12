-- CS-14 migration 023: drop the dead `facts.hash` column + `idx_facts_hash`.
-- Migration 001 declared `hash TEXT` ("the dedup key") and an index on
-- (scope_user_id, hash), but the only write path bound NULL unconditionally and
-- nothing ever read the column — stage-1 exact dedup recomputes its digest
-- in-process. The artifact was inert schema (a NULL column + an index over it).
-- The index must be dropped before the column (SQLite refuses DROP COLUMN while
-- an index references it). 001 is checksum-locked, so the removal lives here.
DROP INDEX IF EXISTS idx_facts_hash;
ALTER TABLE facts DROP COLUMN hash;
