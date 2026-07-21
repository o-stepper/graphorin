[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / createReadResultTool

# Function: createReadResultTool()

```ts
function createReadResultTool(opts): Tool<ReadResultInput, ReadResultOutput>;
```

Defined in: packages/tools/src/built-in/read-result.ts:108

**`Stable`**

Build a `read_result` tool bound to a specific [ResultReader](/api/@graphorin/tools/interfaces/ResultReader.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ReadResultToolOptions`](/api/@graphorin/tools/interfaces/ReadResultToolOptions.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`ReadResultInput`](/api/@graphorin/tools/interfaces/ReadResultInput.md), [`ReadResultOutput`](/api/@graphorin/tools/interfaces/ReadResultOutput.md)\&gt;
