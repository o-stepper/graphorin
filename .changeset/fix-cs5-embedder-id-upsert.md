---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): adopt embedder_id on a late-embedded fact upsert (CS-5)

The facts `ON CONFLICT(id) DO UPDATE` set never touched `embedder_id`. A fact
first written without an embedding kept `embedder_id = NULL`; a later
`rememberWithEmbedding` wrote the vec0 row but left the column NULL, and the
`searchVector` guard (`AND f.embedder_id = ?`) then hid the fact from vector
search forever.

The upsert now sets `embedder_id` from the incoming write *only when it carries
an embedding* (`CASE WHEN excluded.embedder_id IS NOT NULL THEN
excluded.embedder_id ELSE facts.embedder_id END`). The conditional matters:
`supersede()` re-remembers the new fact without an embedding, so an
unconditional `embedder_id = excluded.embedder_id` would null a previously-set
id and open the reverse hole.

Red-first: a real-sqlite test writes a fact with no embedding, re-embeds it, and
asserts `searchVector` now returns it; a second test re-remembers an embedded
fact without an embedding and asserts its `embedder_id` (and vector hit) survive.
