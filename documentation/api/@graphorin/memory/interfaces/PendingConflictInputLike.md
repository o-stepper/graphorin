[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PendingConflictInputLike

# Interface: PendingConflictInputLike

Defined in: packages/memory/src/internal/storage-adapter.ts:321

Pending-queue payload - Stage 5 (defer-to-deep) hands the row over
to the deep-phase LLM judge (Phase 10c).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:324 |
| <a id="property-conflictingids"></a> `conflictingIds?` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids surfaced by Stage 2. | packages/memory/src/internal/storage-adapter.ts:328 |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:323 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:326 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/internal/storage-adapter.ts:322 |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictAuditStage`](/api/@graphorin/memory/type-aliases/ConflictAuditStage.md) | - | packages/memory/src/internal/storage-adapter.ts:325 |
