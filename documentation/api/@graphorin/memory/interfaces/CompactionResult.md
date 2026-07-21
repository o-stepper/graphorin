[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionResult

# Interface: CompactionResult

Defined in: packages/memory/src/context-engine/compaction/types.ts:44

**`Stable`**

Outcome of a compaction call.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | - | packages/memory/src/context-engine/compaction/types.ts:48 |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | - | packages/memory/src/context-engine/compaction/types.ts:47 |
| <a id="property-droppedmessageids"></a> `droppedMessageIds` | `readonly` | readonly `string`[] | - | packages/memory/src/context-engine/compaction/types.ts:49 |
| <a id="property-droppedmessageindices"></a> `droppedMessageIndices` | `readonly` | readonly `number`[] | - | packages/memory/src/context-engine/compaction/types.ts:50 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | packages/memory/src/context-engine/compaction/types.ts:54 |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | - | packages/memory/src/context-engine/compaction/types.ts:55 |
| <a id="property-preservedmessages"></a> `preservedMessages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/memory/src/context-engine/compaction/types.ts:51 |
| <a id="property-source"></a> `source` | `readonly` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | - | packages/memory/src/context-engine/compaction/types.ts:53 |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | packages/memory/src/context-engine/compaction/types.ts:45 |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | - | packages/memory/src/context-engine/compaction/types.ts:46 |
| <a id="property-summarytrust"></a> `summaryTrust?` | `readonly` | `"trusted"` \| `"untrusted-derived"` | Trust classification of the produced summary. `'untrusted-derived'` when the compacted window contained `<<<untrusted_content>>>` envelopes or the injection heuristics flagged the summarizer output - the LLM-authored summary body is then wrapped in a `trust="derived"` envelope so taint survives compaction instead of laundering into an authoritative system message. `'trusted'` (or absent, for custom strategies that predate the field) otherwise. | packages/memory/src/context-engine/compaction/types.ts:66 |
| <a id="property-trimmedmessages"></a> `trimmedMessages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/memory/src/context-engine/compaction/types.ts:52 |
