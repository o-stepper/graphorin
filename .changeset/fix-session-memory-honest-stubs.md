---
'@graphorin/memory': minor
---

MRET-12: the three SessionMemory stubs stop fabricating success.
`compact()` previously reported `total - keepLastN` as
removed/summarized while deleting nothing (with the default
`keepLastN: 0` it claimed to have compacted the entire session) — it
now returns `{ removed: 0, summarized: 0 }` with truthful span
attributes until a real message splice exists at this layer
(session-context compaction is owned by the context engine).
`flushImportant()` and `attributedFor()` keep their no-op returns but
their JSDoc now says NOT IMPLEMENTED instead of promising behaviour
that never shipped.
