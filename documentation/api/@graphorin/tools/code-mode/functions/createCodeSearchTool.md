[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / createCodeSearchTool

# Function: createCodeSearchTool()

```ts
function createCodeSearchTool(opts): Tool<CodeSearchInput, string>;
```

Defined in: packages/tools/src/code-mode/meta-tools.ts:93

**`Stable`**

Build the `code_search` meta-tool. Returns matching `tools.<name>(…)`
signatures as text (eager substring match + the deferred pool).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`CodeSearchToolOptions`](/api/@graphorin/tools/code-mode/interfaces/CodeSearchToolOptions.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`CodeSearchInput`](/api/@graphorin/tools/code-mode/interfaces/CodeSearchInput.md), `string`\&gt;
