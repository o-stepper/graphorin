---
'@graphorin/memory': patch
---

P1-2 — auto-importance ("poignancy") scoring + episode formation (see
`memory-improvement-proposals.md` §5, summary-table row **P1-2 · Auto-importance
scoring + episode formation**). The episodic tier's triple-signal retrieval
(recency × relevance × importance) was running on a missing third signal —
nothing assigned importance and episodes were never auto-formed. The
consolidator standard phase now closes that gap, and (per Generative Agents /
MemoryBank, arXiv:2305.10250) assigns an LLM importance score at write time. All
changes are additive ⇒ `patch` (pre-1.0).

- The standard phase auto-forms **one quarantined episode per processed slice**:
  a single budgeted episode-summarization LLM call summarizes the slice and
  (when `importanceScoring` is on) rates its importance `1–10`; the episode is
  recorded via `EpisodicMemory.record(...)` with `startedAt`/`endedAt` = the
  slice's first/last message timestamps, `provenance: 'extraction'`, and
  `status: 'quarantined'` (P1-4). Importance is normalized to `[0, 1]` and is a
  *soft* signal — it never gates retention. New `parseEpisode` /
  `normalizeImportance` helpers back this (defensive: an extraction-shaped
  payload is never mistaken for an episode; out-of-range / missing scores clamp
  or drop rather than corrupt).
- New per-tier config `formEpisodes` + `importanceScoring` (on `ConsolidatorConfig`,
  `CreateConsolidatorOptions`, and `createMemory({ consolidator })`). Defaults
  **on at the `standard` / `full` tiers, off at `free` / `cheap` / `custom`**.
  Episode formation is budget-aware (an exhausted budget degrades to fact-only)
  and a no-op when no episodic tier or no provider is wired.
- `EpisodeInput` gains optional `provenance` + `status`, and
  `EpisodicMemory.record(...)` now persists them (the store already had the
  columns since migration 013). `PhaseOutcome` gains an `episodesFormed` counter.
- `EpisodeSearchOptions` gains `includeQuarantined?` (threaded through the FTS +
  vector paths), giving episodes the same validation/inspector read path facts
  already had — without it, auto-quarantined episodes would be unreachable.

Fact-level importance (and its decay weighting) is intentionally deferred to
**X-1**; P1-2 scopes importance to episodes, so no schema migration is required.
