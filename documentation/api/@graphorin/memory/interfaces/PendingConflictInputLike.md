[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PendingConflictInputLike

# Interface: PendingConflictInputLike

Defined in: [packages/memory/src/internal/storage-adapter.ts:371](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L371)

Pending-queue payload - Stage 5 (defer-to-deep) hands the row over
to the deep-phase LLM judge (Phase 10c).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:374](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L374) |
| <a id="property-conflictingids"></a> `conflictingIds?` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids surfaced by Stage 2. | [packages/memory/src/internal/storage-adapter.ts:378](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L378) |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:373](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L373) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:376](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L376) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/memory/src/internal/storage-adapter.ts:372](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L372) |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictAuditStage`](/api/@graphorin/memory/type-aliases/ConflictAuditStage.md) | - | [packages/memory/src/internal/storage-adapter.ts:375](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L375) |
