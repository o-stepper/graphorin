[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionMetadataPayload

# Interface: CompactionMetadataPayload

Defined in: packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:101

Section-9 metadata payload. Stable shape so consumers can
deserialize and reason about a compaction event.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-compactedatiso"></a> `compactedAtIso` | `readonly` | `string` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:102 |
| <a id="property-compactedfrommessageids"></a> `compactedFromMessageIds` | `readonly` | readonly `string`[] | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:103 |
| <a id="property-compactedfrommessageindices"></a> `compactedFromMessageIndices` | `readonly` | readonly `number`[] | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:104 |
| <a id="property-compactedfromtokens"></a> `compactedFromTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:105 |
| <a id="property-preserverecentturns"></a> `preserveRecentTurns` | `readonly` | `number` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:110 |
| <a id="property-summarizermodel"></a> `summarizerModel` | `readonly` | `string` \| `null` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:107 |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:106 |
| <a id="property-templatename"></a> `templateName` | `readonly` | `string` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:108 |
| <a id="property-templateversion"></a> `templateVersion` | `readonly` | `string` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:109 |
