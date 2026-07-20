[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryOperationKind

# Type Alias: MemoryOperationKind

```ts
type MemoryOperationKind = "extract" | "update" | "delete";
```

Defined in: packages/evals/src/loaders/memory-eval.ts:90

**`Stable`**

Kind of an operation-level gold memory point (HaluMem-style):
`extract` - the point must exist in memory after ingest; `update` -
the point must have replaced [MemoryGoldPoint.previous](/api/@graphorin/evals/interfaces/MemoryGoldPoint.md#property-previous);
`delete` - the point must be gone from memory after ingest.
