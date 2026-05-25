[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryEvalTurn

# Interface: MemoryEvalTurn

Defined in: evals/src/loaders/memory-eval.ts:23

One conversational turn inside a haystack session.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | - | evals/src/loaders/memory-eval.ts:25 |
| <a id="property-role"></a> `role` | `readonly` | `"user"` \| `"assistant"` | - | evals/src/loaders/memory-eval.ts:24 |
| <a id="property-timestamp"></a> `timestamp?` | `readonly` | `string` | Dataset-native (often ISO-8601) timestamp, when the dataset provides one. | evals/src/loaders/memory-eval.ts:27 |
