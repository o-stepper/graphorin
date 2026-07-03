[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / PendingConflictInput

# Interface: PendingConflictInput

Defined in: packages/store-sqlite/src/conflict-store.ts:84

Per-pending row enqueued for the deep-phase LLM judge.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:87 |
| <a id="property-conflictingids"></a> `conflictingIds?` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids surfaced by Stage 2. | packages/store-sqlite/src/conflict-store.ts:91 |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:86 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:89 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/store-sqlite/src/conflict-store.ts:85 |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictPipelineStage`](/api/@graphorin/store-sqlite/type-aliases/ConflictPipelineStage.md) | - | packages/store-sqlite/src/conflict-store.ts:88 |
