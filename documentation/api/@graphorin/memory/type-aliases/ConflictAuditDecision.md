[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictAuditDecision

# Type Alias: ConflictAuditDecision

```ts
type ConflictAuditDecision = "admit" | "dedup" | "supersede" | "pending";
```

Defined in: packages/memory/src/internal/storage-adapter.ts:173

Final pipeline outcome recorded against the candidate fact. Matches
the storage adapter's `ConflictPipelineDecision` exactly.

## Stable
