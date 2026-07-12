[**Graphorin API reference v0.8.0**](../../../index.md)

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

Defined in: [packages/memory/src/internal/storage-adapter.ts:280](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L280)

Stable lowercase identifier for the pipeline stage that produced a
conflict decision. Mirrored byte-for-byte by
`@graphorin/store-sqlite`'s `ConflictPipelineStage`.

## Stable
