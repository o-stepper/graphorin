[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PendingConflictInputLike

# Interface: PendingConflictInputLike

Defined in: packages/memory/src/internal/storage-adapter.ts:286

Pending-queue payload — Stage 5 (defer-to-deep) hands the row over
to the deep-phase LLM judge (Phase 10c).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:289 |
| <a id="property-conflictingids"></a> `conflictingIds?` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids surfaced by Stage 2. | packages/memory/src/internal/storage-adapter.ts:293 |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:288 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:291 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/internal/storage-adapter.ts:287 |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictAuditStage`](/api/@graphorin/memory/type-aliases/ConflictAuditStage.md) | - | packages/memory/src/internal/storage-adapter.ts:290 |
