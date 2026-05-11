[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / Dataset

# Interface: Dataset\&lt;I, O, M\&gt;

Defined in: packages/observability/src/eval/types.ts:24

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
| <a id="property-cases"></a> `cases` | `readonly` | readonly [`Case`](/api/@graphorin/observability/interfaces/Case.md)\&lt;`I`, `O`, `M`\&gt;[] | packages/observability/src/eval/types.ts:25 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | \{ `createdAt?`: `Date`; `description?`: `string`; `name?`: `string`; \} | packages/observability/src/eval/types.ts:26 |
| `metadata.createdAt?` | `readonly` | `Date` | packages/observability/src/eval/types.ts:29 |
| `metadata.description?` | `readonly` | `string` | packages/observability/src/eval/types.ts:28 |
| `metadata.name?` | `readonly` | `string` | packages/observability/src/eval/types.ts:27 |
