[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / FromTracesOptions

# Interface: FromTracesOptions\&lt;I, O\&gt;

Defined in: evals/src/loaders/from-traces.ts:24

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description surfaced in `Dataset.metadata.description`. | evals/src/loaders/from-traces.ts:30 |
| <a id="property-extract"></a> `extract` | `readonly` | (`events`) => \| [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`I`, `O`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\> \| `null` | Distil one `Case<I, O>` from every group of events sharing a `runId`. | evals/src/loaders/from-traces.ts:26 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name surfaced in `Dataset.metadata.name`. | evals/src/loaders/from-traces.ts:28 |
