[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createConversationSearchTool

# Function: createConversationSearchTool()

```ts
function createConversationSearchTool(deps): Tool<ConversationSearchInput, ConversationSearchOutput>;
```

Defined in: packages/memory/src/tools/recall-tools.ts:208

**`Stable`**

`conversation_search` - FTS5 search over the active session
messages.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`ConversationSearchInput`](/api/@graphorin/memory/tools/interfaces/ConversationSearchInput.md), [`ConversationSearchOutput`](/api/@graphorin/memory/tools/interfaces/ConversationSearchOutput.md)\&gt;
