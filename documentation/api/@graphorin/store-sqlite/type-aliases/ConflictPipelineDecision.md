[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConflictPipelineDecision

# Type Alias: ConflictPipelineDecision

```ts
type ConflictPipelineDecision = "admit" | "dedup" | "supersede" | "pending" | "judge-unparseable";
```

Defined in: [packages/store-sqlite/src/conflict-store.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L39)

Final outcome the pipeline produced for a candidate fact write.
`'admit'` is the default no-conflict path; the other variants record
an active intervention.

## Stable
