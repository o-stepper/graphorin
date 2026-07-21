[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PostCompactionHookContext

# Interface: PostCompactionHookContext

Defined in: packages/memory/src/context-engine/compaction/types.ts:193

**`Stable`**

Per-call context handed to a post-compaction hook.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/memory/src/context-engine/compaction/types.ts:198 |
| <a id="property-droppedmessages"></a> `droppedMessages?` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | The messages this compaction dropped (summarized away / cleared), in original order. Lets re-anchoring hooks recover references - e.g. `reanchorRecentResults` re-lists the result handles that just left the window. | packages/memory/src/context-engine/compaction/types.ts:206 |
| <a id="property-result"></a> `result` | `readonly` | [`CompactionResult`](/api/@graphorin/memory/interfaces/CompactionResult.md) | - | packages/memory/src/context-engine/compaction/types.ts:194 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | packages/memory/src/context-engine/compaction/types.ts:196 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/context-engine/compaction/types.ts:195 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/memory/src/context-engine/compaction/types.ts:197 |
| <a id="property-source"></a> `source` | `readonly` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | - | packages/memory/src/context-engine/compaction/types.ts:199 |
