[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryEvalSession

# Interface: MemoryEvalSession

Defined in: [packages/evals/src/loaders/memory-eval.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L44)

One prior session in the haystack the memory system must ingest
before the question is asked.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/evals/src/loaders/memory-eval.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L45) |
| <a id="property-turns"></a> `turns` | `readonly` | readonly [`MemoryEvalTurn`](/api/@graphorin/evals/interfaces/MemoryEvalTurn.md)[] | [packages/evals/src/loaders/memory-eval.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L46) |
