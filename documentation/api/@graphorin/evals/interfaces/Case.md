[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Case

# Interface: Case\&lt;I, O, M\&gt;

Defined in: [packages/observability/dist/eval/types.d.ts:14](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L14)

One sample from an eval dataset.

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
| <a id="property-expected"></a> `expected?` | `readonly` | `O` | [packages/observability/dist/eval/types.d.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L17) |
| <a id="property-id"></a> `id?` | `readonly` | `string` | [packages/observability/dist/eval/types.d.ts:15](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L15) |
| <a id="property-input"></a> `input` | `readonly` | `I` | [packages/observability/dist/eval/types.d.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L16) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `M` | [packages/observability/dist/eval/types.d.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L18) |
