---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): purge() now deletes graph links so GDPR delete works (CS-1)

`SemanticMemoryStore.purge()` removed `facts_fts`, the per-embedder `facts_vec_*`
rows, and the `facts` row, but never `fact_entities`. Since
`fact_entities.fact_id` references `facts(id)` with no `ON DELETE` and the
connection runs `foreign_keys = ON`, purging any graph-linked fact raised
`FOREIGN KEY constraint failed` and rolled back the whole transaction —
including the `PURGE` audit row. With `graph.entityResolution` enabled every
s/p/o fact is linked on write, so the documented GDPR purge path (and deep-phase
dedup, which calls `purge`) was categorically broken for linked facts.

`purge()` now runs `DELETE FROM fact_entities WHERE fact_id = ?` inside the same
transaction, before deleting the `facts` row. The canonical `entities` are
shared data and are intentionally left intact — only this fact's links go.

Red-first: a real-sqlite test links a fact to an entity then purges it —
pre-fix it threw the FK error; post-fix the fact and its links are gone and the
entity remains.
