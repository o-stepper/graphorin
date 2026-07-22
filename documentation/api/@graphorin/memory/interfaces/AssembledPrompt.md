[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AssembledPrompt

# Interface: AssembledPrompt

Defined in: packages/memory/src/context-engine/io-types.ts:72

**`Stable`**

Output of [ContextEngine.assemble](/api/@graphorin/memory/interfaces/ContextEngine.md#assemble).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-annotations"></a> `annotations` | `readonly` | readonly [`AnnotatedPart`](/api/@graphorin/memory/interfaces/AnnotatedPart.md)[] | Per-part annotations, in the same order as the assembled system content. Span-only - never serialized to the wire payload. | packages/memory/src/context-engine/io-types.ts:79 |
| <a id="property-autorecall"></a> `autoRecall` | `readonly` | [`AutoRecallTriggerResult`](/api/@graphorin/memory/interfaces/AutoRecallTriggerResult.md) | Whether auto-recall was triggered this assembly. | packages/memory/src/context-engine/io-types.ts:93 |
| <a id="property-inboundpreamblefired"></a> `inboundPreambleFired` | `readonly` | `boolean` | Whether the per-step inbound preamble fragment fired this assembly. | packages/memory/src/context-engine/io-types.ts:85 |
| <a id="property-layerallocation"></a> `layerAllocation` | `readonly` | [`AllocationResult`](/api/@graphorin/memory/interfaces/AllocationResult.md) | Per-layer allocation snapshot. Surfaced for tests + diagnostics. | packages/memory/src/context-engine/io-types.ts:83 |
| <a id="property-localeid"></a> `localeId` | `readonly` | `string` | Resolved locale id (`'en'` for the default; custom otherwise). | packages/memory/src/context-engine/io-types.ts:89 |
| <a id="property-memorybasemode"></a> `memoryBaseMode` | `readonly` | [`MemoryBaseMode`](/api/@graphorin/memory/type-aliases/MemoryBaseMode.md) | Resolved memory base mode. | packages/memory/src/context-engine/io-types.ts:91 |
| <a id="property-privacycounters"></a> `privacyCounters` | `readonly` | `Readonly`\<`Record`\&lt;[`PrivacyDecisionReason`](/api/@graphorin/memory/type-aliases/PrivacyDecisionReason.md), `number`\&gt;\> | Privacy-filter counters surfaced to the metadata block. | packages/memory/src/context-engine/io-types.ts:87 |
| <a id="property-systemmessage"></a> `systemMessage` | `readonly` | \{ `content`: `string`; `role`: `"system"`; \} | Single system message ready for `provider.stream(...)`. | packages/memory/src/context-engine/io-types.ts:74 |
| `systemMessage.content` | `readonly` | `string` | - | packages/memory/src/context-engine/io-types.ts:74 |
| `systemMessage.role` | `readonly` | `"system"` | - | packages/memory/src/context-engine/io-types.ts:74 |
