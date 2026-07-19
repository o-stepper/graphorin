[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / LoadJsonlOptions

# Interface: LoadJsonlOptions

Defined in: packages/evals/src/loaders/jsonl.ts:13

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description surfaced in `Dataset.metadata.description`. | packages/evals/src/loaders/jsonl.ts:17 |
| <a id="property-mapper"></a> `mapper?` | `readonly` | (`line`, `index`) => [`Case`](/api/@graphorin/evals/interfaces/Case.md)\&lt;`unknown`, `unknown`\&gt; | Map a parsed line into a `Case`. Default forwards the line verbatim. Override to translate column names or coerce types. | packages/evals/src/loaders/jsonl.ts:22 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional dataset name surfaced in `Dataset.metadata.name`. | packages/evals/src/loaders/jsonl.ts:15 |
