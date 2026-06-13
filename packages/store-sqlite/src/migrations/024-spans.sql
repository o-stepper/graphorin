-- RP-17 migration 024: durable span persistence.
-- Before this, the only durable trace sink was the JSONL exporter, which
-- nothing in server / cli / agent wired up — so `Session.replay()` defaulted to
-- an empty source (it emitted only replay.start / replay.end) and the
-- `graphorin memory why` introspection had nowhere queryable to read from.
-- Spans now land here, keyed by the `graphorin.session.id` attribute, so replay
-- and `memory why` can read a real run back. The `@graphorin/store-sqlite`
-- span exporter writes rows; `traceSourceForSession(...)` reads them in order.
CREATE TABLE IF NOT EXISTS spans (
  span_id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  parent_id TEXT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  start_unix_nano INTEGER NOT NULL,
  end_unix_nano INTEGER NOT NULL,
  status TEXT NOT NULL,
  status_message TEXT,
  attributes_json TEXT NOT NULL,
  events_json TEXT NOT NULL,
  sensitivity_json TEXT,
  session_id TEXT
);

-- Replay + `memory why` page by session, ordered by start time.
CREATE INDEX IF NOT EXISTS idx_spans_session_start ON spans (session_id, start_unix_nano);
-- Full-trace reads (parent/child reconstruction) page by trace.
CREATE INDEX IF NOT EXISTS idx_spans_trace_start ON spans (trace_id, start_unix_nano);
