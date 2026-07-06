[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PartialContextLocalePack

# Interface: PartialContextLocalePack

Defined in: packages/memory/src/context-engine/locale-packs/types.ts:121

Builder used by application code that wants to ship a custom
locale pack. The builder freezes every input so the pack can be
safely reused across multiple `Memory` instances without
accidental mutation.

Partial packs are accepted: any field omitted falls back to the
English default at compose time, with a one-time WARN per locale
per missing surface (the safety guarantee is preserved even when
an operator installs a partial locale pack).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-autorecalltriggers"></a> `autoRecallTriggers?` | `readonly` | `Partial`\<[`AutoRecallTriggers`](/api/@graphorin/memory/interfaces/AutoRecallTriggers.md)\> | packages/memory/src/context-engine/locale-packs/types.ts:124 |
| <a id="property-basetemplate"></a> `baseTemplate?` | `readonly` | `Partial`\<[`BaseTemplateFragments`](/api/@graphorin/memory/interfaces/BaseTemplateFragments.md)\> | packages/memory/src/context-engine/locale-packs/types.ts:123 |
| <a id="property-compactionsummarytemplate"></a> `compactionSummaryTemplate?` | `readonly` | `Partial`\<[`CompactionSummaryTemplate`](/api/@graphorin/memory/interfaces/CompactionSummaryTemplate.md)\> | packages/memory/src/context-engine/locale-packs/types.ts:126 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/context-engine/locale-packs/types.ts:122 |
| <a id="property-inboundsanitizationpreamble"></a> `inboundSanitizationPreamble?` | `readonly` | `Partial`\<[`InboundSanitizationPreamble`](/api/@graphorin/memory/interfaces/InboundSanitizationPreamble.md)\> | packages/memory/src/context-engine/locale-packs/types.ts:125 |
