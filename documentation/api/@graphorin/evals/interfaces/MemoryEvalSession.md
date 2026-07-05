[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryEvalSession

# Interface: MemoryEvalSession

Defined in: evals/src/loaders/memory-eval.ts:36

One prior session in the haystack the memory system must ingest
before the question is asked.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | evals/src/loaders/memory-eval.ts:37 |
| <a id="property-turns"></a> `turns` | `readonly` | readonly [`MemoryEvalTurn`](/api/@graphorin/evals/interfaces/MemoryEvalTurn.md)[] | evals/src/loaders/memory-eval.ts:38 |
