[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / createRunbookSearchTool

# Function: createRunbookSearchTool()

```ts
function createRunbookSearchTool(deps): Tool<RunbookSearchInput, RunbookSearchOutput>;
```

Defined in: packages/memory/src/tools/runbook-tools.ts:73

**`Stable`**

`runbook_search` - find validated procedures matching a task
description. Quarantined (unvalidated induced) procedures never
surface here: they must not drive actions until validated.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`RunbookSearchInput`](/api/@graphorin/memory/tools/interfaces/RunbookSearchInput.md), [`RunbookSearchOutput`](/api/@graphorin/memory/tools/interfaces/RunbookSearchOutput.md)\&gt;
