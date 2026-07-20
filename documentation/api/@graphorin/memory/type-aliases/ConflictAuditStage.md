[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictAuditStage

# Type Alias: ConflictAuditStage

```ts
type ConflictAuditStage = 
  | "exact-dedup"
  | "embedding-three-zone"
  | "heuristic-regex"
  | "subject-predicate"
  | "defer-to-deep";
```

Defined in: packages/memory/src/internal/storage-adapter.ts:323

**`Stable`**

Stable lowercase identifier for the pipeline stage that produced a
conflict decision. Mirrored byte-for-byte by
`@graphorin/store-sqlite`'s `ConflictPipelineStage`.
