-- store-13 migration 025: index the supersede-chain columns.
-- `historyOf` walks the chain with per-node lookups on
-- `supersedes` / `superseded_by` (plus the scope guard); with no index
-- on either column each BFS node degraded to a scan of the user's
-- facts, so `fact_history` latency grew O(chain x user-facts).
-- Partial indexes: only linked rows are indexed (the vast majority of
-- facts carry NULL in both columns).
CREATE INDEX IF NOT EXISTS idx_facts_supersedes
  ON facts (supersedes)
  WHERE supersedes IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facts_superseded_by
  ON facts (superseded_by)
  WHERE superseded_by IS NOT NULL;
