[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionSummaryTemplate

# Interface: CompactionSummaryTemplate

Defined in: packages/memory/src/context-engine/locale-packs/types.ts:72

Structured 9-section summary template fragments used by the
auto-compaction summarizer (RB-46). Section order is fixed; only
the per-section header / preamble text is locale-extensible.

Each entry is the human-readable header for the corresponding
section. Section indices are 1-based to match the documented
9-section layout in the architecture doc.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-preamble"></a> `preamble` | `readonly` | `string` | Preamble injected at the top of the summarizer prompt. | packages/memory/src/context-engine/locale-packs/types.ts:74 |
| <a id="property-sections"></a> `sections` | `readonly` | readonly \[`string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`\] | 9 section headers. | packages/memory/src/context-engine/locale-packs/types.ts:76 |
