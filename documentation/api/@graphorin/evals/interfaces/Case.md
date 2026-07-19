[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / Case

# Interface: Case\&lt;I, O, M\&gt;

Defined in: packages/observability/dist/eval/types.d.ts:14

**`Stable`**

One sample from an eval dataset.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `I` | - |
| `O` | `unknown` |
| `M` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-expected"></a> `expected?` | `readonly` | `O` | packages/observability/dist/eval/types.d.ts:17 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | packages/observability/dist/eval/types.d.ts:15 |
| <a id="property-input"></a> `input` | `readonly` | `I` | packages/observability/dist/eval/types.d.ts:16 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `M` | packages/observability/dist/eval/types.d.ts:18 |
