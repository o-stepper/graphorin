[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / createCodeExecuteTool

# Function: createCodeExecuteTool()

```ts
function createCodeExecuteTool(opts): Tool<CodeExecuteInput, string>;
```

Defined in: packages/tools/src/code-mode/meta-tools.ts:223

**`Stable`**

Build the `code_execute` meta-tool. Its output is the script's final
value rendered as a string, so the executor's `maxResultTokens` /
`'spill-to-file'` pipeline bounds even a large final result.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`CodeExecuteToolOptions`](/api/@graphorin/tools/code-mode/interfaces/CodeExecuteToolOptions.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`CodeExecuteInput`](/api/@graphorin/tools/code-mode/interfaces/CodeExecuteInput.md), `string`\&gt;
