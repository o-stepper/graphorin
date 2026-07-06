[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictAuditDecision

# Type Alias: ConflictAuditDecision

```ts
type ConflictAuditDecision = "admit" | "dedup" | "supersede" | "pending" | "judge-unparseable";
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:288](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L288)

Final pipeline outcome recorded against the candidate fact. Matches
the storage adapter's `ConflictPipelineDecision` exactly.
`'judge-unparseable'` closes a pending row whose deep-phase judge
call repeatedly failed (MCON-9) so it stops being re-billed forever.

## Stable
