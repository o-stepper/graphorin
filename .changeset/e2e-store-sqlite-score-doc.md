---
'@graphorin/store-sqlite': patch
---

Fix the stale `searchVector` doc comment (part of E-01, N-01/21): the fact KNN search documented its `score` as `1 - distance` (raw cosine similarity), but since CS-3 it is populated via `scoreFromDistance`, a normalized `[0, 1]` similarity (`(1 + cos) / 2` for the cosine metric). Doc-only change, no runtime behavior change.
