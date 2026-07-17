[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionSummaryTemplate

# Interface: CompactionSummaryTemplate

Defined in: [packages/memory/src/context-engine/locale-packs/types.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L67)

Structured section-template fragments used by the auto-compaction
summarizer (RB-46). Section order is fixed; only the per-section
header / preamble text is locale-extensible.

Each entry is the human-readable header for the corresponding
section. Section indices are 1-based to match the documented
layout in the architecture doc.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-preamble"></a> `preamble` | `readonly` | `string` | Preamble injected at the top of the summarizer prompt. | [packages/memory/src/context-engine/locale-packs/types.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L69) |
| <a id="property-sections"></a> `sections` | `readonly` | readonly \[`string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`\] | 12 section headers. The last two are filled by the harness. | [packages/memory/src/context-engine/locale-packs/types.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L71) |
