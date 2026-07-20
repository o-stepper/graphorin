[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionContext

# Interface: CompactionContext

Defined in: packages/memory/src/context-engine/compaction/types.ts:25

**`Stable`**

Per-call context handed to a custom strategy + post-compaction
hooks. Threaded through Phase 12's lifecycle.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/types.ts:28 |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/types.ts:32 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | packages/memory/src/context-engine/compaction/types.ts:31 |
| <a id="property-preserverecentturns"></a> `preserveRecentTurns` | `readonly` | `number` | packages/memory/src/context-engine/compaction/types.ts:34 |
| <a id="property-providertrust"></a> `providerTrust` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/core/type-aliases/LocalProviderTrust.md) | packages/memory/src/context-engine/compaction/types.ts:35 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/types.ts:26 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/context-engine/compaction/types.ts:29 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/types.ts:27 |
| <a id="property-source"></a> `source` | `readonly` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | packages/memory/src/context-engine/compaction/types.ts:30 |
| <a id="property-summarizermodel"></a> `summarizerModel?` | `readonly` | `string` \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) | packages/memory/src/context-engine/compaction/types.ts:36 |
| <a id="property-thresholdtokens"></a> `thresholdTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/types.ts:33 |
