[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactHistoryTool

# Function: createFactHistoryTool()

```ts
function createFactHistoryTool(deps): Tool<FactHistoryInput, FactHistoryOutput>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:393

**`Stable`**

`fact_history` - trace how a fact changed over time. Returns the
full bi-temporal supersede chain the given fact belongs to, oldest →
newest, including superseded entries, so the agent can answer "what
did the user say before" / "how did this change". Read-only.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`FactHistoryInput`](/api/@graphorin/memory/tools/interfaces/FactHistoryInput.md), [`FactHistoryOutput`](/api/@graphorin/memory/tools/interfaces/FactHistoryOutput.md)\&gt;
