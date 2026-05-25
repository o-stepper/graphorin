---
'@graphorin/memory': patch
'@graphorin/cli': patch
---

X-3 — memory introspection & "why was this recalled?" explainability (see
`memory-improvement-proposals.md` §5, summary-table row **X-3 · Memory
introspection & recall explainability**). When the assistant said something
surprising there was no easy way to see *which* memories drove it, why they
ranked, or what the consolidator / reflection did. The per-signal scores
already existed on every `MemoryHit` but were never surfaced; the supersede
chain, quarantine state, conflict log, and insight citations were queryable in
SQL but had no operator surface. All changes are additive ⇒ `patch` (pre-1.0).

- **Recall explanation** (`@graphorin/memory`): new `explainRecall(hits, {
  query, rerankerId })` builds a structured `RecallExplanation` — the per-memory
  decomposition of the signals the hybrid pipeline summed into each score
  (`bm25`, `vector`, the fused `rrf` / `rrf.list_N` terms, and the `decay`
  multiplier), in final-rank order — and `formatRecallExplanation(...)` renders
  it as a compact ASCII block. Pure and deterministic: it re-uses the signals
  the pipeline left on each hit rather than re-deriving them, so the explanation
  always matches the ranking that actually happened. New `RecallExplanation` /
  `RecalledMemoryExplanation` types.
- `SemanticMemory.search` now records the **decay multiplier** as a `decay`
  signal on each hit (so a score drop can be attributed to staleness, not just
  fusion) and attaches the per-signal breakdown to the `memory.search.semantic`
  span under `memory.search.semantic.explain` — **ids + scores + signals only,
  never the query text** (the query stays surfaced solely as `query_length`,
  preserving the existing trace-privacy posture). The explanation rides whatever
  exporter the operator has configured (console / JSONL / OTLP) — Graphorin does
  not persist spans to SQLite, so there is no new always-on store.
- **Inspector** (`@graphorin/cli`): `graphorin memory inspect <factId>` surfaces
  a fact's retrieval-trust status + provenance, its full bi-temporal supersede
  chain (oldest → newest), the audit-log events recorded against it, the
  conflict decisions that referenced it, and the (quarantined) insights that
  cite it. New `runMemoryInspect` + `MemoryInspect*` result types.
- **Activity view** (`@graphorin/cli`): `graphorin memory activity` reports a
  store-wide view of what the consolidator / reflection passes did — quarantine
  counts (facts / episodes / insights), the most recent audit-log events
  (supersede / validate / quarantine / archive), and the most recent conflict
  decisions, with a `--limit` cap. New `runMemoryActivity` + `MemoryActivity*`
  types.

Both CLI commands are pure read-only inspection through `store.connection`
(exactly like `memory status`'s count queries) — **no embedder or provider
required, fully offline**. A dedicated `memory why` command over historical
recall events is intentionally deferred: spans are not persisted to SQLite, so
answering it would require a new always-on span-store subsystem; the recall
explanation is meanwhile available programmatically and on the live span.
