---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): honour the registered distance metric in vec0 + score in [0,1] (CS-3)

vec0 tables were created as `vec0(... embedding float[dim])` with no
`distance_metric`, so sqlite-vec computed L2 while `embedding_meta`
recorded (and labelled) the metric as `'cosine'`, and `score: 1 - distance`
for an L2 distance is not a cosine similarity (it can go negative).

- The vec0 `CREATE VIRTUAL TABLE` now passes `distance_metric=<metric>`
  (`cosine` / `L2`; `'dot'` falls back to cosine — vec0 has no dot metric).
- `MemoryHit.score` / `signals.vector` are computed by a metric-aware
  `scoreFromDistance` (cosine distance ∈ [0,2] → `1 - d/2` ∈ [0,1]; L2 →
  `1/(1+d)` ∈ (0,1]) instead of the L2-only `1 - distance`.

Vec0 tables created before this fix used L2; the default transformers.js
embedder normalizes its vectors, so cosine ranking is rank-equivalent to
L2 and existing recall order is unchanged — but a non-normalizing custom
embedder should re-register its embedder to recreate the vec tables under
the correct metric.
