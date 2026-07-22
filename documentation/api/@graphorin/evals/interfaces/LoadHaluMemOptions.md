[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / LoadHaluMemOptions

# Interface: LoadHaluMemOptions

Defined in: packages/evals/src/loaders/halumem.ts:63

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description surfaced in `Dataset.metadata.description`. | packages/evals/src/loaders/halumem.ts:71 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional dataset name surfaced in `Dataset.metadata.name`. | packages/evals/src/loaders/halumem.ts:69 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Local path to the dataset JSON (under `benchmarks/.datasets/`). | packages/evals/src/loaders/halumem.ts:65 |
| <a id="property-stage"></a> `stage` | `readonly` | [`HaluMemStage`](/api/@graphorin/evals/type-aliases/HaluMemStage.md) | Case expansion - see [HaluMemStage](/api/@graphorin/evals/type-aliases/HaluMemStage.md). | packages/evals/src/loaders/halumem.ts:67 |
