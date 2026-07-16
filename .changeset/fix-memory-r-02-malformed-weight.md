---
'@graphorin/memory': patch
---

Fix a malformed per-call fusion weight failing the whole search (e2e 2026-07-13, MEMORY-R-02, minor). A `weighted` fusion weight that was `NaN`, negative, or non-numeric reached the `WeightedRRFReranker` constructor and threw a `TypeError`, rejecting the entire search rather than degrading as documented. The search path now coerces each per-call weight (`fts` / `vector` / `graph` / `entity`) to the neutral default `1` when it is not a finite non-negative number. Regression test pins that a `NaN` / negative weight yields the default RRF ranking instead of throwing.
