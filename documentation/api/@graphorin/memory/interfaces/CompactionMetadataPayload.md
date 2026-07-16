[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionMetadataPayload

# Interface: CompactionMetadataPayload

Defined in: [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L171)

Section-9 metadata payload. Stable shape so consumers can
deserialize and reason about a compaction event.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-compactedatiso"></a> `compactedAtIso` | `readonly` | `string` | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L172) |
| <a id="property-compactedfrommessageids"></a> `compactedFromMessageIds` | `readonly` | readonly `string`[] | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:173](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L173) |
| <a id="property-compactedfrommessageindices"></a> `compactedFromMessageIndices` | `readonly` | readonly `number`[] | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L174) |
| <a id="property-compactedfromtokens"></a> `compactedFromTokens` | `readonly` | `number` | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:175](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L175) |
| <a id="property-preserverecentturns"></a> `preserveRecentTurns` | `readonly` | `number` | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:180](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L180) |
| <a id="property-summarizermodel"></a> `summarizerModel` | `readonly` | `string` \| `null` | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:177](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L177) |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:176](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L176) |
| <a id="property-templatename"></a> `templateName` | `readonly` | `string` | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:178](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L178) |
| <a id="property-templateversion"></a> `templateVersion` | `readonly` | `string` | [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:179](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L179) |
