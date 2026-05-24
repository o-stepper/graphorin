[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Dataset

# Interface: Dataset\&lt;I, O, M\&gt;

Defined in: observability/dist/eval/types.d.ts:23

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `I` | - |
| `O` | `unknown` |
| `M` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cases"></a> `cases` | `readonly` | readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\&lt;`I`, `O`, `M`\&gt;[] | observability/dist/eval/types.d.ts:24 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | \{ `createdAt?`: `Date`; `description?`: `string`; `name?`: `string`; \} | observability/dist/eval/types.d.ts:25 |
| `metadata.createdAt?` | `readonly` | `Date` | observability/dist/eval/types.d.ts:28 |
| `metadata.description?` | `readonly` | `string` | observability/dist/eval/types.d.ts:27 |
| `metadata.name?` | `readonly` | `string` | observability/dist/eval/types.d.ts:26 |
