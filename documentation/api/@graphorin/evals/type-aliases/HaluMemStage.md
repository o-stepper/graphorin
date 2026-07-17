[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / HaluMemStage

# Type Alias: HaluMemStage

```ts
type HaluMemStage = "operations" | "qa";
```

Defined in: [packages/evals/src/loaders/halumem.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/halumem.ts#L60)

Which cases a HaluMem-format file expands into: `'operations'`
yields one case per sample carrying the gold memory points (for the
extraction / update scorers); `'qa'` yields one case per probe
question (for the QA hallucination scorer).

## Stable
