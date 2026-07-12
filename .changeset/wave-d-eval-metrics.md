---
'@graphorin/evals': minor
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

Operation-level memory eval metrics (wave-D D1, plan item 4). `@graphorin/evals` gains the HaluMem-format loader (`loadHaluMemDataset` / `parseHaluMem`, stage `'operations' | 'qa'`, user-supplied local JSON per DEC-154) over new type-only operation contracts (`MemoryGoldPoint`, `MemoryOperationsEvalInput`, `MemoryOperationsObservation`), plus the staged `scorers/memory` family: deterministic `memoryExtractionRecall` / `memoryExtractionPrecision` / `memoryUpdateOmission` (token-F1 matching with a proximity tie-break for update pairs; custom matchers supported) and the judged `memoryQaHallucination` (llmJudge-based, EB-7-hardened). The store side adds `SemanticMemoryStoreExt.listActive` (recall-eligible enumeration with optional `excludePendingSupersede`) - shared groundwork for the D2 projection and the new `benchmarks/halumem` suite, whose `--conflict-pipeline on|off` axis is the update-omission value proof for the conflict pipeline; the longmemeval runner gains the same switch (replacing the historic hardcoded `off`) plus a `--max-cost-usd` run-level ceiling composed from `withCostLimit` + `withCostTracking`.
