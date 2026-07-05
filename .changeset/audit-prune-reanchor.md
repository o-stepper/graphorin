---
'@graphorin/security': patch
'@graphorin/cli': patch
---

Audit retention vs Merkle anchoring (W-062):

- `@graphorin/security`: fixed a crash in `pruneAudit` against the shipped better-sqlite3 binding - the re-hash loop wrote through the connection while `iterate()` held a live statement iterator, throwing "This database connection is busy executing a query" whenever surviving entries needed re-rooting (the in-memory test double masked it). Survivors are now rewritten in closed-iterator batches (bounded memory). The `pruneAudit` package docs now state explicitly that verification against ANY pre-prune Merkle checkpoint fails afterwards by design, indistinguishably from a truncate-and-re-root attack. A contract test pins this behavior.
- `@graphorin/cli`: `graphorin audit prune` prints a re-anchor reminder after every destructive prune (sign + distribute a fresh checkpoint, mark old anchors superseded).
- Security guide: new "Retention and anchoring" runbook (prune -> sign fresh checkpoint -> distribute -> supersede old anchors -> accept anchored-history reset) plus the documented identifier-level erasure limitation of the time-prefix-only prune.
