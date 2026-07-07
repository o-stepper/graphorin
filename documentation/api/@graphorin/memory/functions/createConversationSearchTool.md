[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createConversationSearchTool

# Function: createConversationSearchTool()

```ts
function createConversationSearchTool(deps): Tool<ConversationSearchInput, ConversationSearchOutput>;
```

Defined in: [packages/memory/src/tools/recall-tools.ts:208](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tools/recall-tools.ts#L208)

`conversation_search` - FTS5 search over the active session
messages.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`ConversationSearchInput`, `ConversationSearchOutput`\&gt;

## Stable
