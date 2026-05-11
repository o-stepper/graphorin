[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemorySearchOptions

# Interface: MemorySearchOptions

Defined in: packages/core/src/types/memory.ts:127

Search options shared across memory tiers.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-daterange"></a> `dateRange?` | `readonly` | \{ `from?`: `string`; `to?`: `string`; \} | packages/core/src/types/memory.ts:131 |
| `dateRange.from?` | `readonly` | `string` | packages/core/src/types/memory.ts:131 |
| `dateRange.to?` | `readonly` | `string` | packages/core/src/types/memory.ts:131 |
| <a id="property-includearchived"></a> `includeArchived?` | `readonly` | `boolean` | packages/core/src/types/memory.ts:132 |
| <a id="property-query"></a> `query` | `readonly` | `string` | packages/core/src/types/memory.ts:128 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/core/src/types/memory.ts:133 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/core/src/types/memory.ts:130 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | packages/core/src/types/memory.ts:129 |
