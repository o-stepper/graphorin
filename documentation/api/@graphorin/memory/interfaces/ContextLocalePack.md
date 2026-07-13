[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ContextLocalePack

# Interface: ContextLocalePack

Defined in: [packages/memory/src/context-engine/locale-packs/types.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L95)

A `LocalePack` collects every consumer-facing string the
ContextEngine renders. Consumers register additional locales via
[defineContextLocalePack](/api/@graphorin/memory/functions/defineContextLocalePack.md). The framework is locale-agnostic
- no language is privileged in core.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autorecalltriggers"></a> `autoRecallTriggers` | `readonly` | [`AutoRecallTriggers`](/api/@graphorin/memory/interfaces/AutoRecallTriggers.md) | Auto-recall trigger regex set. | [packages/memory/src/context-engine/locale-packs/types.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L101) |
| <a id="property-basetemplate"></a> `baseTemplate` | `readonly` | [`BaseTemplateFragments`](/api/@graphorin/memory/interfaces/BaseTemplateFragments.md) | Layer 1 base template fragments. | [packages/memory/src/context-engine/locale-packs/types.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L99) |
| <a id="property-compactionsummarytemplate"></a> `compactionSummaryTemplate` | `readonly` | [`CompactionSummaryTemplate`](/api/@graphorin/memory/interfaces/CompactionSummaryTemplate.md) | Structured compaction summary template (RB-46). | [packages/memory/src/context-engine/locale-packs/types.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L105) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable lowercase identifier (`'en'`, `'de'`, `'fr'`, …). | [packages/memory/src/context-engine/locale-packs/types.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L97) |
| <a id="property-inboundsanitizationpreamble"></a> `inboundSanitizationPreamble` | `readonly` | [`InboundSanitizationPreamble`](/api/@graphorin/memory/interfaces/InboundSanitizationPreamble.md) | Inbound-sanitization preamble (D4 - RB-43). | [packages/memory/src/context-engine/locale-packs/types.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L103) |
