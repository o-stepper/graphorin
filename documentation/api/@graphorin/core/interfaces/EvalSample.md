[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EvalSample

# Interface: EvalSample\&lt;TInput, TOutput\&gt;

Defined in: packages/core/src/contracts/eval-scorer.ts:25

**`Stable`**

A single sample from an eval dataset.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-actual"></a> `actual` | `readonly` | `TOutput` | packages/core/src/contracts/eval-scorer.ts:29 |
| <a id="property-expected"></a> `expected?` | `readonly` | `TOutput` | packages/core/src/contracts/eval-scorer.ts:28 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/core/src/contracts/eval-scorer.ts:26 |
| <a id="property-input"></a> `input` | `readonly` | `TInput` | packages/core/src/contracts/eval-scorer.ts:27 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/core/src/contracts/eval-scorer.ts:30 |
