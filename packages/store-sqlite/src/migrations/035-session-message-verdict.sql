-- B3 (item 15): persist the run loop's per-turn security verdict next
-- to the message it annotates, so the memory ingest gate can exclude
-- guardrail-blocked turns from extraction deterministically. NULL =
-- the turn passed every gate (the overwhelmingly common case).
ALTER TABLE session_messages ADD COLUMN verdict_json TEXT;
