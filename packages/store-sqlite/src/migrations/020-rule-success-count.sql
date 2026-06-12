-- MCON-2 (part 4) migration 020: demonstrated-success counter on `rules`.
-- An induced procedure (P2-2) lands quarantined and must not drive actions
-- until validated. Promotion-by-demonstrated-success records each verified
-- successful reuse here; once the configured threshold is reached the
-- procedure is promoted (injection-flagged texts still refuse). Counting is
-- additive bookkeeping — existing rows start at 0 and nothing reads the
-- column until the caller opts into `procedurePromotion`.
ALTER TABLE rules ADD COLUMN success_count INTEGER NOT NULL DEFAULT 0;
