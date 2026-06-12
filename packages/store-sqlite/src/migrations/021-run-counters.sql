-- MCON-17 migration 021: P1-1 / P1-2 counters on `consolidator_runs`.
-- The runtime computed `episodesFormed` / `insightsCreated` on every
-- phase outcome and then dropped them at `recordRunFinish` — the run
-- audit could not answer "did reflection actually produce anything?".
-- Additive, default 0 for historical rows.
ALTER TABLE consolidator_runs ADD COLUMN episodes_formed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE consolidator_runs ADD COLUMN insights_created INTEGER NOT NULL DEFAULT 0;
