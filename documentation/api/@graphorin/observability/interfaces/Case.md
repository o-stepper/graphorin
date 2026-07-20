[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / Case

# Interface: Case\&lt;I, O, M\&gt;

Defined in: packages/observability/src/eval/types.ts:14

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
| <a id="property-expected"></a> `expected?` | `readonly` | `O` | packages/observability/src/eval/types.ts:17 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | packages/observability/src/eval/types.ts:15 |
| <a id="property-input"></a> `input` | `readonly` | `I` | packages/observability/src/eval/types.ts:16 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `M` | packages/observability/src/eval/types.ts:18 |
