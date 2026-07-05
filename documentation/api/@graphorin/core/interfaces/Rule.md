[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Rule

# Interface: Rule

Defined in: packages/core/src/types/memory.ts:220

Procedural rule - a standing order activated when its `condition` matches.

## Stable

## Extends

- [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`agentId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-agentid) | packages/core/src/types/memory.ts:105 |
| <a id="property-condition"></a> `condition?` | `readonly` | `string` | - | - | - | packages/core/src/types/memory.ts:223 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`createdAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-createdat) | packages/core/src/types/memory.ts:108 |
| <a id="property-deletedat"></a> `deletedAt?` | `readonly` | `string` | Soft-delete tombstone. Append-only stores set this instead of removing rows, so prior history is preserved per principle 8. | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`deletedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-deletedat) | packages/core/src/types/memory.ts:114 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`id`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-id) | packages/core/src/types/memory.ts:102 |
| <a id="property-kind"></a> `kind` | `readonly` | `"procedural"` | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`kind`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-kind) | - | packages/core/src/types/memory.ts:221 |
| <a id="property-owner"></a> `owner?` | `readonly` | [`MemoryOwner`](/api/@graphorin/core/type-aliases/MemoryOwner.md) | Principal dimension (D3). `'agent'` on induced procedures. See [MemoryOwner](/api/@graphorin/core/type-aliases/MemoryOwner.md). | - | - | packages/core/src/types/memory.ts:267 |
| <a id="property-priority"></a> `priority` | `readonly` | `number` | - | - | - | packages/core/src/types/memory.ts:224 |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`MemoryProvenance`](/api/@graphorin/core/type-aliases/MemoryProvenance.md) | Trust-provenance tag (P1-4 / P2-2). Induced procedures are `'induction'`; author-defined rules omit it (treated first-party). See [MemoryProvenance](/api/@graphorin/core/type-aliases/MemoryProvenance.md). | - | - | packages/core/src/types/memory.ts:250 |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sensitivity`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sensitivity) | packages/core/src/types/memory.ts:107 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sessionId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sessionid) | packages/core/src/types/memory.ts:106 |
| <a id="property-status"></a> `status?` | `readonly` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) | Retrieval-trust state (P1-4 / P2-2). Induced procedures land `'quarantined'` and are excluded from activation (they must not drive actions) until validated; author-defined rules omit it (treated `'active'`). See [MemoryStatus](/api/@graphorin/core/type-aliases/MemoryStatus.md). | - | - | packages/core/src/types/memory.ts:257 |
| <a id="property-steps"></a> `steps?` | `readonly` | readonly `string`[] | Ordered, value-abstracted step sequence of an *induced* workflow (P2-2) - e.g. `['search for {product}', 'add {quantity} to cart', 'check out']`. Present only on procedures distilled from successful agent trajectories; author-defined rules omit it. | - | - | packages/core/src/types/memory.ts:231 |
| <a id="property-successcount"></a> `successCount?` | `readonly` | `number` | Demonstrated-success counter (MCON-2 part 4). Incremented by `ProceduralMemory.recordOutcome(...)` on each verified successful reuse; drives promotion-by-demonstrated-success for quarantined induced procedures once the configured threshold is reached. Absent ⇒ never counted (adapters without the column). | - | - | packages/core/src/types/memory.ts:265 |
| <a id="property-successcriteria"></a> `successCriteria?` | `readonly` | readonly `string`[] | Voyager-style verifiable success criteria stored alongside an induced procedure (P2-2) so a reuse can *self-verify* its outcome instead of trusting the procedure blindly. Author-defined rules omit it. | - | - | packages/core/src/types/memory.ts:244 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`tags`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-tags) | packages/core/src/types/memory.ts:115 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | - | - | packages/core/src/types/memory.ts:222 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`updatedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-updatedat) | packages/core/src/types/memory.ts:109 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`userId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-userid) | packages/core/src/types/memory.ts:104 |
| <a id="property-variables"></a> `variables?` | `readonly` | readonly `string`[] | Names of the variables abstracted from the trajectory's concrete values (P2-2) - the `{product}` / `{quantity}` placeholders that appear in [Rule.steps](/api/@graphorin/core/interfaces/Rule.md#property-steps). Lets a reused procedure be re-bound to fresh arguments instead of replaying one run's literals. | - | - | packages/core/src/types/memory.ts:238 |
