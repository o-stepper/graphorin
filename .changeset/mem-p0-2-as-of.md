---
'@graphorin/core': patch
'@graphorin/memory': patch
'@graphorin/store-sqlite': patch
---

P0-2 — point-in-time (`as_of`) temporal queries (see
`memory-improvement-proposals.md` §5, summary-table row **P0-2 · Point-in-time
(`as_of`) temporal queries**). Activates the read path over the bi-temporal
columns Graphorin already stores, turning a latent storage investment into a
user-visible capability aimed at the hardest LongMemEval categories (temporal /
knowledge-update). No schema migration.

`@graphorin/core`: `MemorySearchOptions` gains an optional `asOf?: string`
(ISO-8601) — the shared point-in-time read instant.

`@graphorin/store-sqlite`: fact `search` + `searchVector` apply the validity
predicate `(valid_from IS NULL OR valid_from <= asOf) AND (valid_to IS NULL OR
valid_to > asOf)` when `asOf` is set (episodes filter on `started_at <= asOf`);
absent ⇒ byte-identical SQL, so default reads are unchanged. New
`historyOf(scope, factId)` walks the supersede chain (both directions,
cycle-safe, scope-guarded) and returns it oldest → newest, including superseded
/ soft-deleted rows.

`@graphorin/memory`: `FactSearchOptions` and `EpisodeSearchOptions` gain
`asOf?`, threaded to the store on both the FTS and vector candidate lists
(plus a `memory.search.*.as_of` span attribute). New
`SemanticMemory.history(scope, factId)` surfaces the supersede chain (with a
friendly error when the adapter lacks `historyOf`). The fact-tool surface adds
`asOf` to `fact_search` and a new read-only `fact_history` tool, appended last
so the canonical tool indices are unchanged (nine → ten).

All changes are additive and backward-compatible ⇒ `patch` (pre-1.0).
