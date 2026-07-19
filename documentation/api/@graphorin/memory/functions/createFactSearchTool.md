[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactSearchTool

# Function: createFactSearchTool()

```ts
function createFactSearchTool(deps): Tool<FactSearchInput, FactSearchOutput>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:275

**`Stable`**

`fact_search` - hybrid (vector + FTS5) search over the user's
semantic memory. Results merged through the configured reranker.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`FactSearchInput`, `FactSearchOutput`\&gt;
