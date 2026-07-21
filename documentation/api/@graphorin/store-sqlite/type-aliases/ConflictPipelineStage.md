[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConflictPipelineStage

# Type Alias: ConflictPipelineStage

```ts
type ConflictPipelineStage = 
  | "exact-dedup"
  | "embedding-three-zone"
  | "heuristic-regex"
  | "subject-predicate"
  | "defer-to-deep";
```

Defined in: packages/store-sqlite/src/conflict-store.ts:25

**`Stable`**

Stage label written into `fact_conflicts.stage` /
`conflict_check_pending.stage`. Stable lowercase identifier so
downstream tooling can pattern-match without parsing prose.
