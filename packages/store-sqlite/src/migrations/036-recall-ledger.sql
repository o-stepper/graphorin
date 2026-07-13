-- 036: wave-D D4 - persistent recall ledger.
-- facts.access_count (migration 027) counts EVERY recall; this table
-- counts DISTINCT queries (by normalized-query hash) per fact, feeding
-- the PromotionPolicy `minUniqueQueries` threshold: a fact recalled 50
-- times by one repeated query is weaker promotion evidence than one
-- recalled by 5 different questions. Rows ride their fact: hard fact
-- purges and the session-delete cascade remove them (see
-- SESSION_SCOPED_PURGES facts.refs).
CREATE TABLE IF NOT EXISTS fact_recall_queries (
  fact_id    TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  first_seen INTEGER NOT NULL,
  PRIMARY KEY (fact_id, query_hash)
) WITHOUT ROWID;
