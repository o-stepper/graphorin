[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runToolsLint

# Function: runToolsLint()

```ts
function runToolsLint(options?): Promise<ToolsLintReport>;
```

Defined in: packages/cli/src/commands/tools-lint.ts:161

**`Stable`**

Run the discovery + grader pipeline. Returns the structured report
the CLI emits to stdout.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ToolsLintOptions`](/api/@graphorin/cli/interfaces/ToolsLintOptions.md) |

## Returns

`Promise`\&lt;[`ToolsLintReport`](/api/@graphorin/cli/interfaces/ToolsLintReport.md)\&gt;
