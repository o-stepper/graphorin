---
'@graphorin/store-sqlite': minor
'@graphorin/memory': minor
---

Vector-index hygiene (item 10 steps 1-2). The index version key now records the write-path contextualization mode: `embedding_meta` gains an `index_mode` column (migration 033), `registerOrReturn` accepts `indexMode` and fails a mode switch exactly like a `configHash` change, while legacy rows adopt the current mode once instead of failing retroactively. `createMemory` computes the recipe from `contextualRetrieval` plus the consolidator's opt-in `llm` enrichment and gains `onIncompatibleEmbedder: 'fail' | 'fts-only'` - the `'fts-only'` mode degrades an incompatible embedder to keyword-only search (WARN + `x.memory.embedder-incompatible` span, vectors stay stale) instead of crash-looping an always-on assistant until `graphorin memory migrate` rebuilds the index.
