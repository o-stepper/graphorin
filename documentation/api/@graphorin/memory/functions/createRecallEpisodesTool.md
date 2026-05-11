[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createRecallEpisodesTool

# Function: createRecallEpisodesTool()

```ts
function createRecallEpisodesTool(deps): Tool<{
  dateRange?: {
     from?: string;
     to?: string;
  };
  query: string;
  topK?: number;
}, {
  episodes: {
     endedAt: string;
     episodeId: string;
     score: number;
     startedAt: string;
     summary: string;
  }[];
}>;
```

Defined in: packages/memory/src/tools/recall-tools.ts:53

`recall_episodes` — triple-signal episode retrieval (recency ×
relevance × importance).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `dateRange?`: \{
     `from?`: `string`;
     `to?`: `string`;
  \};
  `query`: `string`;
  `topK?`: `number`;
\}, \{
  `episodes`: \{
     `endedAt`: `string`;
     `episodeId`: `string`;
     `score`: `number`;
     `startedAt`: `string`;
     `summary`: `string`;
  \}[];
\}\>

## Stable
