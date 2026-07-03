[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Fact

# Interface: Fact

Defined in: packages/core/src/types/memory.ts:123

Single semantic-memory fact: an atomic statement about the user / world.

## Stable

## Extends

- [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`agentId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-agentid) | packages/core/src/types/memory.ts:90 |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | - | - | - | packages/core/src/types/memory.ts:142 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`createdAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-createdat) | packages/core/src/types/memory.ts:93 |
| <a id="property-deletedat"></a> `deletedAt?` | `readonly` | `string` | Soft-delete tombstone. Append-only stores set this instead of removing rows, so prior history is preserved per principle 8. | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`deletedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-deletedat) | packages/core/src/types/memory.ts:99 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`id`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-id) | packages/core/src/types/memory.ts:87 |
| <a id="property-importance"></a> `importance?` | `readonly` | `number` | Optional salience hint in `[0, 1]` for multi-signal forgetting (X-1). A *soft* signal — higher importance slows a fact's decay and delays capacity-bounded eviction, but never gates recall and never forces retention. Absent on rows written before the feature (treated as neutral, `0.5`). | - | - | packages/core/src/types/memory.ts:150 |
| <a id="property-kind"></a> `kind` | `readonly` | `"semantic"` | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`kind`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-kind) | - | packages/core/src/types/memory.ts:124 |
| <a id="property-object"></a> `object?` | `readonly` | `string` | Object entity of the s/p/o triple (P2-1). See [Fact.subject](/api/@graphorin/core/interfaces/Fact.md#property-subject). | - | - | packages/core/src/types/memory.ts:141 |
| <a id="property-predicate"></a> `predicate?` | `readonly` | `string` | Relation label of the [Fact.subject](/api/@graphorin/core/interfaces/Fact.md#property-subject)→[Fact.object](/api/@graphorin/core/interfaces/Fact.md#property-object) triple (P2-1). | - | - | packages/core/src/types/memory.ts:139 |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`MemoryProvenance`](/api/@graphorin/core/type-aliases/MemoryProvenance.md) | Trust-provenance tag (P1-4). Absent on rows written before the feature; treated as first-party (`active`) when missing. | - | - | packages/core/src/types/memory.ts:163 |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sensitivity`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sensitivity) | packages/core/src/types/memory.ts:92 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sessionId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sessionid) | packages/core/src/types/memory.ts:91 |
| <a id="property-status"></a> `status?` | `readonly` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) | Retrieval-trust state (P1-4). Defaults to `active`; derived / injection-flagged writes land `quarantined` and are excluded from default recall. | - | - | packages/core/src/types/memory.ts:169 |
| <a id="property-subject"></a> `subject?` | `readonly` | `string` | Structured `(subject, predicate, object)` triple for the in-SQLite relation graph (P2-1). The consolidator's extraction prompt emits these; first-party `remember({ text })` writes usually omit them. `subject`/`object` are the graph *entities* (resolved to canonical ids in `fact_entities`); `predicate` is the relation label and is not itself an entity. Absent on rows written before the feature, and on plain free-text facts — they are a soft enrichment that powers one-hop expansion ([MemorySearchOptions](/api/@graphorin/core/interfaces/MemorySearchOptions.md) has no field; the memory tier's search opts in), never a recall gate. | - | - | packages/core/src/types/memory.ts:137 |
| <a id="property-supersededby"></a> `supersededBy?` | `readonly` | `string` | ID of the fact that supersedes this one, if any. | - | - | packages/core/src/types/memory.ts:158 |
| <a id="property-supersedes"></a> `supersedes?` | `readonly` | `string` | ID of the fact this one supersedes, if any. | - | - | packages/core/src/types/memory.ts:156 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`tags`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-tags) | packages/core/src/types/memory.ts:100 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | - | - | packages/core/src/types/memory.ts:125 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`updatedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-updatedat) | packages/core/src/types/memory.ts:94 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`userId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-userid) | packages/core/src/types/memory.ts:89 |
| <a id="property-validfrom"></a> `validFrom?` | `readonly` | `string` | Bi-temporal: when the fact became true, ISO-8601. | - | - | packages/core/src/types/memory.ts:152 |
| <a id="property-validto"></a> `validTo?` | `readonly` | `string` | Bi-temporal: when the fact stopped being true, ISO-8601. | - | - | packages/core/src/types/memory.ts:154 |
