[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryEvalSession

# Interface: MemoryEvalSession

Defined in: packages/evals/src/loaders/memory-eval.ts:44

**`Stable`**

One prior session in the haystack the memory system must ingest
before the question is asked.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/evals/src/loaders/memory-eval.ts:45 |
| <a id="property-turns"></a> `turns` | `readonly` | readonly [`MemoryEvalTurn`](/api/@graphorin/evals/interfaces/MemoryEvalTurn.md)[] | packages/evals/src/loaders/memory-eval.ts:46 |
