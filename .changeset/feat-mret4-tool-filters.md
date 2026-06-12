---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

MRET-4 / MST-5: the recall tools' declared filters now actually filter,
and the system prompt stops advertising parameters that do not exist.

- `recall_episodes.dateRange` works end-to-end: the episodic store
  applies an overlap predicate (`[started_at, ended_at]` intersects
  `[from, to]`) on the FTS leg, and the tier applies the same semantics
  to the vector leg before the merge.
- `fact_search.tags` works end-to-end: the semantic store applies an
  any-of `json_each(tags_json)` predicate on the FTS leg, and the tier
  enforces the same filter on the fused result so the vector / HyDE /
  graph legs obey it (`FactSearchOptions.tags`).
- The English locale pack's advertised tool signatures now match the
  registered schemas — the old text offered `conversation_search(query,
  dateRange?, roles?)`, `fact_search(..., dateRange?,
  includeArchived?)`, `block_replace(..., new)`,
  `fact_supersede(oldFactId, ...)` and `fact_forget(id, ...)`, none of
  which exist; non-strict zod silently stripped the phantom params so
  the model "filtered" while getting unfiltered results. A contract
  test now keeps every locale-pack tool mention aligned with the real
  schema keys.
