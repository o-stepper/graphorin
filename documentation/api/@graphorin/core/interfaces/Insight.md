[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Insight

# Interface: Insight

Defined in: packages/core/src/types/memory.ts:262

Insight — a higher-order observation the consolidator's reflection
pass (P1-1) synthesizes over recent memories ("the user has cancelled
three evening plans this month — they may be overcommitted"). No
single turn states it; it is *inferred*, so it is always
`provenance: 'reflection'` and lands `status: 'quarantined'` (P1-4),
excluded from action-driving recall until validated.

Every insight carries **mandatory citations** (`cites`) — the ids of
the supporting memories it was synthesized from — so a reader can
trace it back to evidence; this is the "trustworthy reflection"
mitigation against confirmation-bias loops. Insights are managed with
an ExpeL-style salience counter (new insights start at `2`, pruned at
`≤ 0`) and are retrieval-ranked **below** the primary facts they cite.

## Stable

## Extends

- [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`agentId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-agentid) | packages/core/src/types/memory.ts:90 |
| <a id="property-cites"></a> `cites` | `readonly` | readonly `string`[] | IDs of the supporting memories (facts / episodes) this insight was synthesized from. Always ≥ 1 — citations are mandatory; an insight with no traceable evidence is never persisted. | - | - | packages/core/src/types/memory.ts:271 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`createdAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-createdat) | packages/core/src/types/memory.ts:93 |
| <a id="property-deletedat"></a> `deletedAt?` | `readonly` | `string` | Soft-delete tombstone. Append-only stores set this instead of removing rows, so prior history is preserved per principle 8. | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`deletedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-deletedat) | packages/core/src/types/memory.ts:99 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`id`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-id) | packages/core/src/types/memory.ts:87 |
| <a id="property-kind"></a> `kind` | `readonly` | `"insight"` | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`kind`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-kind) | - | packages/core/src/types/memory.ts:263 |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`MemoryProvenance`](/api/@graphorin/core/type-aliases/MemoryProvenance.md) | Trust-provenance tag (P1-4). Reflection-synthesized insights are `'reflection'`. See [MemoryProvenance](/api/@graphorin/core/type-aliases/MemoryProvenance.md). | - | - | packages/core/src/types/memory.ts:282 |
| <a id="property-salience"></a> `salience` | `readonly` | `number` | ExpeL-style salience counter. New insights start at `2`; a maintenance pass up-/down-votes on subsequent corroboration / contradiction and prunes (soft-deletes) insights at `≤ 0`. | - | - | packages/core/src/types/memory.ts:277 |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sensitivity`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sensitivity) | packages/core/src/types/memory.ts:92 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sessionId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sessionid) | packages/core/src/types/memory.ts:91 |
| <a id="property-status"></a> `status?` | `readonly` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) | Retrieval-trust state (P1-4). Insights land `'quarantined'`. See [MemoryStatus](/api/@graphorin/core/type-aliases/MemoryStatus.md). | - | - | packages/core/src/types/memory.ts:287 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`tags`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-tags) | packages/core/src/types/memory.ts:100 |
| <a id="property-text"></a> `text` | `readonly` | `string` | The synthesized higher-order observation. | - | - | packages/core/src/types/memory.ts:265 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`updatedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-updatedat) | packages/core/src/types/memory.ts:94 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`userId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-userid) | packages/core/src/types/memory.ts:89 |
