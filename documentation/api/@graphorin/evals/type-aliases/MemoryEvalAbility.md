[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryEvalAbility

# Type Alias: MemoryEvalAbility

```ts
type MemoryEvalAbility = 
  | "info-extraction"
  | "multi-session"
  | "temporal"
  | "knowledge-update"
  | "abstention";
```

Defined in: packages/evals/src/loaders/memory-eval.ts:56

**`Stable`**

The five LongMemEval abilities. Every loader maps its dataset-native
category onto one of these so per-ability scoring is comparable
across datasets; the raw category is preserved in `Case.metadata`.
