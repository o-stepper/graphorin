[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExample

# Interface: ToolExample\&lt;TInput, TOutput\&gt;

Defined in: packages/core/src/contracts/tool.ts:209

**`Stable`**

Worked example for a `Tool`. Type-parameterized on the same generics
as `Tool`, so a `ToolExample` for `Tool<{ q: string }, { hits: T[] }>`
cannot specify an `input` shape that does not match.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-comment"></a> `comment?` | `readonly` | `string` | packages/core/src/contracts/tool.ts:212 |
| <a id="property-input"></a> `input` | `readonly` | `TInput` | packages/core/src/contracts/tool.ts:210 |
| <a id="property-output"></a> `output` | `readonly` | \| `TOutput` \| [`ToolReturn`](/api/@graphorin/core/interfaces/ToolReturn.md)\&lt;`TOutput`\&gt; | packages/core/src/contracts/tool.ts:211 |
