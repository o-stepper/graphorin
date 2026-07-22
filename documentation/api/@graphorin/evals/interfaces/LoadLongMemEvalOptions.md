[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / LoadLongMemEvalOptions

# Interface: LoadLongMemEvalOptions

Defined in: packages/evals/src/loaders/longmemeval.ts:41

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-abilities"></a> `abilities?` | `readonly` | readonly [`MemoryEvalAbility`](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md)[] | When set, keep only cases whose mapped ability is in this list. | packages/evals/src/loaders/longmemeval.ts:47 |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description surfaced in `Dataset.metadata.description`. | packages/evals/src/loaders/longmemeval.ts:51 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional dataset name surfaced in `Dataset.metadata.name`. | packages/evals/src/loaders/longmemeval.ts:49 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Local path to the dataset JSON (under `benchmarks/.datasets/`). | packages/evals/src/loaders/longmemeval.ts:43 |
| <a id="property-variant"></a> `variant?` | `readonly` | `"S"` \| `"M"` | Which release this file is. `'S'` (~115 sessions) is the default target. | packages/evals/src/loaders/longmemeval.ts:45 |
