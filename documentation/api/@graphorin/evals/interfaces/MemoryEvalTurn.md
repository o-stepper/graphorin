[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryEvalTurn

# Interface: MemoryEvalTurn

Defined in: packages/evals/src/loaders/memory-eval.ts:23

**`Stable`**

One conversational turn inside a haystack session.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | - | packages/evals/src/loaders/memory-eval.ts:25 |
| <a id="property-role"></a> `role` | `readonly` | `"user"` \| `"assistant"` | - | packages/evals/src/loaders/memory-eval.ts:24 |
| <a id="property-speaker"></a> `speaker?` | `readonly` | `string` | Dataset-native speaker NAME (e.g. LOCOMO's `"Melanie"`), when the dataset provides one. Distinct from `role`: two-speaker datasets map onto user/assistant for machinery compatibility, but most LOCOMO questions reference the speakers by name, so the system under test must see the names in the ingested text. | packages/evals/src/loaders/memory-eval.ts:35 |
| <a id="property-timestamp"></a> `timestamp?` | `readonly` | `string` | Dataset-native (often ISO-8601) timestamp, when the dataset provides one. | packages/evals/src/loaders/memory-eval.ts:27 |
