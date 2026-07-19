[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createRecallEpisodesTool

# Function: createRecallEpisodesTool()

```ts
function createRecallEpisodesTool(deps): Tool<RecallEpisodesInput, RecallEpisodesOutput>;
```

Defined in: packages/memory/src/tools/recall-tools.ts:153

**`Stable`**

`recall_episodes` - triple-signal episode retrieval (recency ×
relevance × importance).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`RecallEpisodesInput`, `RecallEpisodesOutput`\&gt;
