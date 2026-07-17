[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / runToolRules

# Function: runToolRules()

```ts
function runToolRules(tool, severityOverrides?): LintFinding[];
```

Defined in: [packages/eslint-plugin/src/tool-discovery.ts:373](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L373)

Run the three RB-49 rules against a discovered tool and return the
findings. The CLI grader maps these findings into per-axis scores;
the ESLint rules forward them to `context.report(...)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`DiscoveredTool`](/api/@graphorin/eslint-plugin/interfaces/DiscoveredTool.md) |
| `severityOverrides?` | \{ `toolDescription?`: `"error"` \| `"warn"` \| `"off"`; `toolExamples?`: `"error"` \| `"warn"` \| `"off"`; `toolParameterNaming?`: `"error"` \| `"warn"` \| `"off"`; \} |
| `severityOverrides.toolDescription?` | `"error"` \| `"warn"` \| `"off"` |
| `severityOverrides.toolExamples?` | `"error"` \| `"warn"` \| `"off"` |
| `severityOverrides.toolParameterNaming?` | `"error"` \| `"warn"` \| `"off"` |

## Returns

[`LintFinding`](/api/@graphorin/eslint-plugin/interfaces/LintFinding.md)[]

## Stable
