[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / gradeTool

# Function: gradeTool()

```ts
function gradeTool(tool, findings): ToolGraderScore;
```

Defined in: src/tool-discovery.ts:505

**`Stable`**

Compute the per-tool grader score (0..100). Each axis is gated by
the findings produced for that axis. The rubric is calibrated
against the fixture catalog (`wellDescribedTool` -> 82,
`placeholderDescriptionTool` -> 20, `examplesPiiTool` -> 61).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`DiscoveredTool`](/api/@graphorin/eslint-plugin/interfaces/DiscoveredTool.md) |
| `findings` | readonly [`LintFinding`](/api/@graphorin/eslint-plugin/interfaces/LintFinding.md)[] |

## Returns

[`ToolGraderScore`](/api/@graphorin/eslint-plugin/interfaces/ToolGraderScore.md)
