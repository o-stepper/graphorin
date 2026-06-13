---
'@graphorin/observability': minor
---

fix(observability): drain in-flight exports on flush + bound JSONL handles (RP-20)

Two correctness bugs in the export path:

- **Lost spans on shutdown.** `sink()` schedules `exporter.export(record)`
  fire-and-forget, but `flush()` only awaited `exporter.flush()`. A span whose
  export was still pending when `shutdown()` ran hit the exporter's
  closed-guard and was silently dropped. `flush()` now drains the set of
  in-flight export promises before flushing, so a span emitted moments before
  shutdown still reaches the sink.
- **File-handle leak.** The JSONL exporter pooled one handle per
  `(session, UTC-month)` and never evicted it — an unbounded fd leak on a
  long-living server. The pool is now LRU-bounded (`maxOpenHandles`, default
  64); an evicted path simply re-opens in append mode on its next export.
  `createJSONLExporter` exposes `openHandleCount()` for assertions.

Red-first tests: a span emitted just before shutdown reaches a slow exporter
(was lost), and writing to more distinct sessions than the cap keeps the open
handle count bounded while preserving every session's data.
