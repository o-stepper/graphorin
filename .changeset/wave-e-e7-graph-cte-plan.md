---
'@graphorin/store-sqlite': patch
---

Fix a catastrophic query-plan instability in the entity-graph expansion CTEs (found by the new `benchmarks/scale` probe, audit 2026-07-04 Wave E, cluster E7). In `expandOneHop` and `expandActivation` the planner could demote the recursive self-reference `walk` to the INNERMOST join loop (it can only ever be scanned), turning one hop-1 expansion into facts-scan x fact_entities-scan x walk-queue-scan - measured at 23.5 seconds for a single query over a 300-fact corpus with hub entities. The recursive step now uses `CROSS JOIN` to pin the join order at `walk -> facts(PK) -> fact_entities -> entities -> fact_entities`; the same query runs in ~10ms, and graph-expanded search (`expandHops`, `graphScoring: 'ppr'`) at 2k facts drops from tens of seconds per query to a ~53ms p95.
