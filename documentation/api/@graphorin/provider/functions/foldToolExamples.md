[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / foldToolExamples

# Function: foldToolExamples()

```ts
function foldToolExamples(tools): readonly ToolDefinition[];
```

Defined in: [packages/provider/src/tool-examples.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/tool-examples.ts#L31)

Fold each tool's `examples` into its `description` and drop the structured
field. Non-destructive: a tool with no examples is returned by reference, and
the whole array is returned unchanged (same reference) when nothing folds - so
callers can cheaply detect a no-op.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tools` | readonly [`ToolDefinition`](/api/@graphorin/core/interfaces/ToolDefinition.md)[] |

## Returns

readonly [`ToolDefinition`](/api/@graphorin/core/interfaces/ToolDefinition.md)[]
