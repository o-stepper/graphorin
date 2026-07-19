[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemorySearchOptions

# Interface: MemorySearchOptions

Defined in: packages/core/src/types/memory.ts:376

**`Stable`**

Search options shared across memory tiers.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `string` | Point-in-time ("as of") read. When set, only records whose validity interval contains this instant are returned. For facts: `(valid_from IS NULL OR valid_from <= asOf) AND (valid_to IS NULL OR valid_to > asOf)`; for episodes: `started_at <= asOf`. ISO-8601. Absent ⇒ fact reads evaluate validity at NOW (see [includeSuperseded](/api/@graphorin/core/interfaces/MemorySearchOptions.md#property-includesuperseded)). | packages/core/src/types/memory.ts:397 |
| <a id="property-daterange"></a> `dateRange?` | `readonly` | \{ `from?`: `string`; `to?`: `string`; \} | - | packages/core/src/types/memory.ts:380 |
| `dateRange.from?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:380 |
| `dateRange.to?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:380 |
| <a id="property-includearchived"></a> `includeArchived?` | `readonly` | `boolean` | - | packages/core/src/types/memory.ts:381 |
| <a id="property-includequarantined"></a> `includeQuarantined?` | `readonly` | `boolean` | Include quarantined memories in the result set. Defaults to `false`: action-driving recall never returns quarantined rows. Set `true` only for the validation / inspector path - never for auto-recall fed back into the model. | packages/core/src/types/memory.ts:388 |
| <a id="property-includesuperseded"></a> `includeSuperseded?` | `readonly` | `boolean` | Include superseded / validity-expired facts in the result set. Defaults to `false`: a default read behaves as `asOf = now`, so a fact whose `validTo` was closed (e.g. by `supersede`) never surfaces as current - exactly what the `fact_supersede` tool promises. Set `true` only for inspector / audit paths that need the full history. Ignored when an explicit [asOf](/api/@graphorin/core/interfaces/MemorySearchOptions.md#property-asof) is supplied. | packages/core/src/types/memory.ts:407 |
| <a id="property-owner"></a> `owner?` | `readonly` | \| [`MemoryOwner`](/api/@graphorin/core/type-aliases/MemoryOwner.md) \| readonly [`MemoryOwner`](/api/@graphorin/core/type-aliases/MemoryOwner.md)[] | Retrieval-time principal filter. When set, only records whose owner is in the requested set match; rows written before the feature (owner absent) are treated as `'user'`. Absent ⇒ no owner filter - behaviour is unchanged. | packages/core/src/types/memory.ts:414 |
| <a id="property-query"></a> `query` | `readonly` | `string` | - | packages/core/src/types/memory.ts:377 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/core/src/types/memory.ts:389 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/core/src/types/memory.ts:379 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | - | packages/core/src/types/memory.ts:378 |
