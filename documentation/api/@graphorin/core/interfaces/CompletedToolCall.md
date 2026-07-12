[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CompletedToolCall

# Interface: CompletedToolCall\&lt;TOutput\&gt;

Defined in: [packages/core/src/types/tool.ts:321](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L321)

A `ToolCall` paired with its outcome and execution metadata. Captured
on `RunState.completedToolCalls` after a successful or failed run.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-call"></a> `call` | `readonly` | [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md) | [packages/core/src/types/tool.ts:322](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L322) |
| <a id="property-outcome"></a> `outcome` | `readonly` | [`ToolOutcome`](/api/@graphorin/core/type-aliases/ToolOutcome.md)\&lt;`TOutput`\&gt; | [packages/core/src/types/tool.ts:323](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L323) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/tool.ts:324](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L324) |
