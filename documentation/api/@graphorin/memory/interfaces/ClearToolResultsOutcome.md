[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ClearToolResultsOutcome

# Interface: ClearToolResultsOutcome

Defined in: packages/memory/src/context-engine/compaction/clear-tool-results.ts:76

Result of a clearing pass. `clearedIndices` empty ⇒ nothing changed.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-clearedindices"></a> `clearedIndices` | `readonly` | readonly `number`[] | packages/memory/src/context-engine/compaction/clear-tool-results.ts:78 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | packages/memory/src/context-engine/compaction/clear-tool-results.ts:77 |
| <a id="property-reclaimedtokens"></a> `reclaimedTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/clear-tool-results.ts:79 |
