---
'@graphorin/core': minor
'@graphorin/store-sqlite': minor
'@graphorin/memory': minor
---

Retrieval SOTA graph wins (audit 2026-07-04 Wave D, cluster D5) - offline, opt-in; the billed/migration-heavy legs stay eval-gated.

- PPR-lite graded expansion (HippoRAG-style damped spreading activation): `SqliteGraphStore.expandActivation` + `FactSearchOptions.expandHops: 0|1|2` + `graphScoring: 'ppr'` score neighbours by `damping^hopDepth` instead of a flat 1.
- Graph + entity as first-class tunable fusion weights (`FusionWeights.graph` / `.entity`, were hardcoded neutral).
- Exact entity-match retriever: `SqliteGraphStore.factsForEntityName` + `FactSearchOptions.entityMatch` add a precise "facts about <entity>" candidate leg.
- `longmemeval` harness gains `--retrieval ppr` / `--retrieval entity`. Bitemporal event time, Matryoshka truncation, and cascade LLM reranking remain eval-gated.
