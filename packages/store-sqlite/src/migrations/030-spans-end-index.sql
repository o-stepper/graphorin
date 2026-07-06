-- W-008 migration 030: index for age-based span retention.
--
-- Migration 024 indexed spans only by (session_id, start_unix_nano) and
-- (trace_id, start_unix_nano); pruneSpans deletes by END time, which
-- would be a full table scan on the unbounded-growth table it is meant
-- to bound.

CREATE INDEX IF NOT EXISTS idx_spans_end ON spans (end_unix_nano);
