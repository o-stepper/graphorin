[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryOperationKind

# Type Alias: MemoryOperationKind

```ts
type MemoryOperationKind = "extract" | "update" | "delete";
```

Defined in: [packages/evals/src/loaders/memory-eval.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L90)

Kind of an operation-level gold memory point (HaluMem-style):
`extract` - the point must exist in memory after ingest; `update` -
the point must have replaced [MemoryGoldPoint.previous](/api/@graphorin/evals/interfaces/MemoryGoldPoint.md#property-previous);
`delete` - the point must be gone from memory after ingest.

## Stable
