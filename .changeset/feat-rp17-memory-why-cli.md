---
'@graphorin/cli': minor
---

feat(cli): `graphorin memory why` — explain why facts were recalled (RP-17, part 3)

With recall spans now persisted (RP-17 / migration 024), `graphorin memory why`
decodes the `memory.search.semantic.explain` attribute the memory search records
on each `memory.search.semantic` span into the per-fact ranking signals — FTS
`bm25`, vector similarity, the fused RRF term, and the decay multiplier — so an
operator can see exactly why a fact surfaced. `--session <id>` scopes to one
session and `--limit <n>` caps the most-recent recalls; `--json` emits the
structured result. Pure read-only inspection; empty when no spans were recorded.
