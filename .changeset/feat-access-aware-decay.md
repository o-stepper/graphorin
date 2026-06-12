---
'@graphorin/store-sqlite': minor
'@graphorin/memory': minor
---

Access-aware decay is now real, and the decay window can no longer be
saturated by archived rows.

- MRET-7: `semantic.search(...)` stamps the recalled facts'
  `last_accessed_at` and bumps `strength` by 0.1 per access (capped at
  2.0) via the new `markAccessed(ids, accessedAt?)` store method — the
  advertised "recently accessed facts decay slower" behaviour existed in
  the read model but nothing ever wrote the columns. The bookkeeping
  write is best-effort: a failure never breaks the read path.
- MCON-6: `listForDecay` excludes archived rows by default. Archived
  facts never receive access bumps, so they pinned the LRU head and —
  once more of them existed than the window size — every light pass saw
  only archived rows and live facts silently stopped decaying.
  Inspection paths opt back in with `{ includeArchived: true }`.
