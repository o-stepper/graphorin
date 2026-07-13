[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryGoldPoint

# Interface: MemoryGoldPoint

Defined in: [packages/evals/src/loaders/memory-eval.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L101)

One operation-level ground-truth memory point. Per-operation gold
labels are what distinguish HaluMem-format datasets from the
QA-level loaders above: they grade the memory system's *write*
pipeline (extraction recall/precision, update omission) instead of
only its final answers.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | The expected memory content: for `extract` the fact that must be present, for `update` the NEW value, for `delete` the fact that must be absent. | [packages/evals/src/loaders/memory-eval.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L108) |
| <a id="property-kind"></a> `kind` | `readonly` | [`MemoryOperationKind`](/api/@graphorin/evals/type-aliases/MemoryOperationKind.md) | - | [packages/evals/src/loaders/memory-eval.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L102) |
| <a id="property-previous"></a> `previous?` | `readonly` | `string` | For `update`: the superseded (old) content. | [packages/evals/src/loaders/memory-eval.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L110) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Which haystack session this point is grounded in, when known. | [packages/evals/src/loaders/memory-eval.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L112) |
