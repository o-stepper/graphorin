[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / createToolSearchTool

# Function: createToolSearchTool()

```ts
function createToolSearchTool(opts): Tool<ToolSearchInput, ToolSearchOutput>;
```

Defined in: packages/tools/src/built-in/tool-search.ts:96

**`Stable`**

Build a `tool_search` tool bound to a specific registry.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ToolSearchToolOptions`](/api/@graphorin/tools/interfaces/ToolSearchToolOptions.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`ToolSearchInput`](/api/@graphorin/tools/interfaces/ToolSearchInput.md), [`ToolSearchOutput`](/api/@graphorin/tools/interfaces/ToolSearchOutput.md)\&gt;
