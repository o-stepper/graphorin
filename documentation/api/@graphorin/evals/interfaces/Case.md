[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Case

# Interface: Case\&lt;I, O, M\&gt;

Defined in: observability/dist/eval/types.d.ts:14

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
| <a id="property-expected"></a> `expected?` | `readonly` | `O` | observability/dist/eval/types.d.ts:17 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | observability/dist/eval/types.d.ts:15 |
| <a id="property-input"></a> `input` | `readonly` | `I` | observability/dist/eval/types.d.ts:16 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `M` | observability/dist/eval/types.d.ts:18 |
