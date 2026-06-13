---
'@graphorin/store-sqlite': minor
---

feat(store-sqlite): durable span persistence for replay + introspection (RP-17, part 1)

The only durable trace sink was the JSONL exporter, which nothing in
server / cli / agent wired up — so `Session.replay()` defaulted to an empty
source and `graphorin memory why` had nowhere queryable to read from.

Migration **024** adds a `spans` table (indexed by `(session_id, start)` and
`(trace_id, start)`), and `@graphorin/store-sqlite` gains:

- `createSqliteSpanExporter(connection)` — a `@graphorin/observability`
  `TraceExporter` that persists finished spans, keyed by the
  `graphorin.session.id` attribute. Wrap it in `withValidation(...)` like any
  exporter.
- `traceSourceForSession(connection, sessionId)` — reads a session's spans
  back as an ordered `AsyncIterable<SpanRecord>`, the exact `traceSource`
  shape `Session.replay()` consumes.

`@graphorin/observability` is now a (type-only) dependency; it stays
non-circular since observability only depends on `@graphorin/core`. Real-sqlite
test: spans written through the exporter read back ordered by start time and
filtered by session.
