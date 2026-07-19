[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PartitionResult

# Interface: PartitionResult\&lt;TRecord\&gt;

Defined in: packages/memory/src/context-engine/privacy-filter.ts:150

**`Stable`**

Bookkeeping returned by [partition](/api/@graphorin/memory/functions/partitionBySensitivity.md). Carries both the
surviving + dropped records and a per-reason counter for the
audit trail.

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-counters"></a> `counters` | `readonly` | `Readonly`\<`Record`\&lt;[`PrivacyDecisionReason`](/api/@graphorin/memory/type-aliases/PrivacyDecisionReason.md), `number`\&gt;\> | packages/memory/src/context-engine/privacy-filter.ts:156 |
| <a id="property-dropped"></a> `dropped` | `readonly` | readonly \{ `reason`: [`PrivacyDecisionReason`](/api/@graphorin/memory/type-aliases/PrivacyDecisionReason.md); `record`: `TRecord`; \}[] | packages/memory/src/context-engine/privacy-filter.ts:152 |
| <a id="property-kept"></a> `kept` | `readonly` | readonly `TRecord`[] | packages/memory/src/context-engine/privacy-filter.ts:151 |
