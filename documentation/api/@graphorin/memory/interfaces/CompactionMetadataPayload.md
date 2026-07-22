[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionMetadataPayload

# Interface: CompactionMetadataPayload

Defined in: packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:169

**`Stable`**

Section-9 metadata payload. Stable shape so consumers can
deserialize and reason about a compaction event.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-compactedatiso"></a> `compactedAtIso` | `readonly` | `string` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:170 |
| <a id="property-compactedfrommessageids"></a> `compactedFromMessageIds` | `readonly` | readonly `string`[] | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:171 |
| <a id="property-compactedfrommessageindices"></a> `compactedFromMessageIndices` | `readonly` | readonly `number`[] | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:172 |
| <a id="property-compactedfromtokens"></a> `compactedFromTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:173 |
| <a id="property-preserverecentturns"></a> `preserveRecentTurns` | `readonly` | `number` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:178 |
| <a id="property-summarizermodel"></a> `summarizerModel` | `readonly` | `string` \| `null` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:175 |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:174 |
| <a id="property-templatename"></a> `templateName` | `readonly` | `string` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:176 |
| <a id="property-templateversion"></a> `templateVersion` | `readonly` | `string` | packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:177 |
