[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictStage

# Type Alias: ConflictStage

```ts
type ConflictStage = 
  | "exact-dedup"
  | "embedding-three-zone"
  | "heuristic-regex"
  | "subject-predicate"
  | "defer-to-deep";
```

Defined in: packages/memory/src/conflict/types.ts:20

**`Stable`**

Stable lowercase identifier of the pipeline stage. Mirrored
byte-for-byte by `@graphorin/store-sqlite`'s `ConflictPipelineStage`
so `fact_conflicts` / `conflict_check_pending` rows can be grouped
deterministically.
