---
'@graphorin/memory': patch
'@graphorin/core': patch
---

W-048: the MemoryStore baseline-vs-full-adapter story is now explicit and gated. `GraphMemoryStoreExt` and `ProceduralMemoryStoreExt` are exported from the root of `@graphorin/memory` (they were package-internal); a type test pins `MemoryStore extends MemoryStoreAdapter`, so any future REQUIRED member on an `*MemoryStoreExt` breaks CI instead of silently breaking third-party core-only adapters; and the TSDoc on core `MemoryStore`, `Insight` and `GraphEntity` (plus the persistence guide) now states where the full-parity surfaces live and that graceful degradation is the contract.
