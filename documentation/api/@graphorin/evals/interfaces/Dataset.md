[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Dataset

# Interface: Dataset\&lt;I, O, M\&gt;

Defined in: [packages/observability/dist/eval/types.d.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L23)

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
| <a id="property-cases"></a> `cases` | `readonly` | readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\&lt;`I`, `O`, `M`\&gt;[] | [packages/observability/dist/eval/types.d.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L24) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | \{ `createdAt?`: `Date`; `description?`: `string`; `name?`: `string`; \} | [packages/observability/dist/eval/types.d.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L25) |
| `metadata.createdAt?` | `readonly` | `Date` | [packages/observability/dist/eval/types.d.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L28) |
| `metadata.description?` | `readonly` | `string` | [packages/observability/dist/eval/types.d.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L27) |
| `metadata.name?` | `readonly` | `string` | [packages/observability/dist/eval/types.d.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L26) |
