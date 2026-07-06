---
'@graphorin/store-sqlite': patch
---

`EpisodicMemoryStore.count()` now applies the `archived = 0` filter its own contract promises (W-155): the doc comment says "same default filters as the FTS search", but archived episodes - excluded from FTS and vector recall since CS-2 - still inflated the count. The visible effect was the "Episodes: N" line of the memory-metadata prompt block (CE-5) drifting above what recall could reach after any `EpisodicMemory.archive()`. Facts-side `count()` already filtered archived rows.
