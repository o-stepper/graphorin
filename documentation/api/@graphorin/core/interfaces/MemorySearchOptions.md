[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemorySearchOptions

# Interface: MemorySearchOptions

Defined in: packages/core/src/types/memory.ts:330

Search options shared across memory tiers.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `string` | Point-in-time ("as of") read. When set, only records whose validity interval contains this instant are returned. For facts: `(valid_from IS NULL OR valid_from <= asOf) AND (valid_to IS NULL OR valid_to > asOf)`; for episodes: `started_at <= asOf`. ISO-8601. Absent ⇒ current behaviour is unchanged (every live row is eligible). | packages/core/src/types/memory.ts:351 |
| <a id="property-daterange"></a> `dateRange?` | `readonly` | \{ `from?`: `string`; `to?`: `string`; \} | - | packages/core/src/types/memory.ts:334 |
| `dateRange.from?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:334 |
| `dateRange.to?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:334 |
| <a id="property-includearchived"></a> `includeArchived?` | `readonly` | `boolean` | - | packages/core/src/types/memory.ts:335 |
| <a id="property-includequarantined"></a> `includeQuarantined?` | `readonly` | `boolean` | Include quarantined memories in the result set (P1-4). Defaults to `false`: action-driving recall never returns quarantined rows. Set `true` only for the validation / inspector path — never for auto-recall fed back into the model. | packages/core/src/types/memory.ts:342 |
| <a id="property-query"></a> `query` | `readonly` | `string` | - | packages/core/src/types/memory.ts:331 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/core/src/types/memory.ts:343 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/core/src/types/memory.ts:333 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | - | packages/core/src/types/memory.ts:332 |
