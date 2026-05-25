---
'@graphorin/core': patch
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

P1-1 — reflection / insight synthesis in the deep phase (see
`memory-improvement-proposals.md` §5, summary-table row **P1-1 · Reflection /
insight synthesis (deep phase)**). Graphorin stored facts but never *thought
about them*. The consolidator's deep phase now runs the Generative-Agents
reflection recipe: when the accumulated importance of recent episodes (P1-2)
crosses a threshold, it asks the model for the few most salient questions,
retrieves evidence for each, and synthesizes a higher-order **insight** — a
distinct, quarantined, cited memory type. All changes are additive ⇒ `patch`
(pre-1.0).

- New `Insight` core type (`kind: 'insight'`, `text`, `cites`, `salience`,
  provenance/status); `'insight'` added to `MemoryKind`, plus
  `memory.consolidate.reflect` / `memory.search.insight` / `memory.read.insight`
  span types. (`@graphorin/core`)
- New migration **014** `insights` table (+ `insights_fts`) and
  `SqliteInsightStore` (insert / list / search / `bumpSalience` / `prune`).
  Search is **FTS5-only** by design — insights are a soft, rank-capped inspector
  surface, not primary recall, so no per-embedder vec0 table is created.
  (`@graphorin/store-sqlite`)
- New `InsightMemoryStoreExt` storage surface + thin read-only `InsightMemory`
  tier (`memory.insights`: `search` / `list` / `get`; empty when the adapter
  exposes no insight surface) + the pure `capInsightsBelowFacts(...)` rank
  ceiling — an insight may never outrank a primary fact **it cites**.
  (`@graphorin/memory`)
- New deep-phase reflection pass (`runReflectionPass`): runs after the conflict
  drain, reusing the same budget / lock / audit envelope. **Citations are set by
  the framework** from the actually-retrieved evidence ids (never chosen by the
  model), so they can never be hallucinated and are always ≥ 1. Insights land
  `provenance: 'reflection'`, `status: 'quarantined'`, ExpeL salience `2`; the
  pass prunes (soft-deletes) any salience-0 insights.
- New per-tier config `reflection` + `importanceThreshold` (default `3`) +
  `reflectionMaxQuestions` (default `3`) on `ConsolidatorConfig`,
  `CreateConsolidatorOptions`, and `createMemory({ consolidator })`. Reflection
  defaults **on at the `full` tier only** (off at `free` / `cheap` / `standard`
  / `custom`) and is triple-gated — enabled by config, an episodic tier present,
  and an insight-capable adapter — so it is a no-op for existing setups.
  `PhaseOutcome` gains an `insightsCreated` counter.

The salience *maintenance* loop here is the deterministic core (start at 2,
`bumpSalience`, prune at 0); corroboration-driven up/down-voting of existing
insights, insight *promotion* (quarantined→active) tooling, and vector search
over insights are intentionally deferred follow-ups.
