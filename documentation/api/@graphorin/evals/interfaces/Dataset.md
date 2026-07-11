[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Dataset

# Interface: Dataset\&lt;I, O, M\&gt;

Defined in: [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts)

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
| <a id="property-cases"></a> `cases` | `readonly` | readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\&lt;`I`, `O`, `M`\&gt;[] | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | \{ `createdAt?`: `Date`; `description?`: `string`; `name?`: `string`; \} | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
| `metadata.createdAt?` | `readonly` | `Date` | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
| `metadata.description?` | `readonly` | `string` | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
| `metadata.name?` | `readonly` | `string` | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
