[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactHistoryTool

# Function: createFactHistoryTool()

```ts
function createFactHistoryTool(deps): Tool<FactHistoryInput, FactHistoryOutput>;
```

Defined in: [packages/memory/src/tools/fact-tools.ts:393](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tools/fact-tools.ts#L393)

`fact_history` - trace how a fact changed over time. Returns the
full bi-temporal supersede chain the given fact belongs to, oldest →
newest, including superseded entries, so the agent can answer "what
did the user say before" / "how did this change". Read-only. P0-2.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`FactHistoryInput`, `FactHistoryOutput`\&gt;

## Stable
