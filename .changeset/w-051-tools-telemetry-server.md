---
'@graphorin/tools': minor
'@graphorin/server': minor
---

W-051: tools/MCP telemetry finally reaches the server's operator surfaces - shadow-mode dataflow findings are observable without hand-wiring.

- `@graphorin/tools`: `CounterSnapshot` gains a `kinds` record (`'counter'` vs `'gauge'` per key, tracked at write time) so exporters can bridge monotonic counters with delta-inc and gauges with absolute set.
- `/v1/metrics`: every scrape folds the live `tool.*` / `mcp.*` counters into the Prometheus registry as lazily-registered `graphorin_tool_*` / `graphorin_mcp_*` series (delta-synced counters - re-scrapes never double-count; absolute gauges; label values sanitized). Histograms are deliberately not bridged yet (documented; raw observations stay available via `snapshotCounters()`).
- Audit chain: a new bridge subscribes `onToolAudit` to the tamper-evident audit log, governed by `audit.toolEvents`: `'security'` (default - dataflow flagged/blocked/declassified, sanitization, approvals, collisions, cap-disabled), `'all'` (adds per-call `tool:execute:*`), `'off'`. Unsubscribed and drained on shutdown before the audit DB closes. Exported for embedders as `bridgeToolAuditToAudit` / `syncToolCounters`.
- `@graphorin/server` now depends on `@graphorin/tools` directly (it previously reached tools types only transitively).
