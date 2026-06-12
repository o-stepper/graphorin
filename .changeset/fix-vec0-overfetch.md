---
'@graphorin/store-sqlite': minor
---

MRET-9: vector KNN no longer starves minority scopes, and tombstones
release their slots. The vec0 k-nearest slice is global (no user
partition) while every scope/validity/quarantine filter applies AFTER
the cut — a dominant user's vectors could filter a minority user down
to zero hits. `searchVector` now over-fetches (k = max(topK×4,
topK+16)) and widens iteratively until `topK` rows survive or the
table is exhausted. `forget()` now deletes the fact's vec0 rows like
`purge()` already did — dead embeddings stop occupying k-nearest
slots.
