[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createConversationSearchTool

# Function: createConversationSearchTool()

```ts
function createConversationSearchTool(deps): Tool<{
  query: string;
  topK?: number;
}, {
  matches: {
     messageId: string;
     score: number;
  }[];
}>;
```

Defined in: packages/memory/src/tools/recall-tools.ts:147

`conversation_search` — FTS5 search over the active session
messages.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `query`: `string`;
  `topK?`: `number`;
\}, \{
  `matches`: \{
     `messageId`: `string`;
     `score`: `number`;
  \}[];
\}\>

## Stable
