[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictAuditInputLike

# Interface: ConflictAuditInputLike

Defined in: [packages/memory/src/internal/storage-adapter.ts:318](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L318)

Single audit row written by `runConflictPipeline(...)`. The optional
`ConflictMemoryStoreExt.recordDecision` accepts this shape; the
default `@graphorin/store-sqlite` implementation persists it into
the `fact_conflicts` table introduced by Phase 10b.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-candidateid"></a> `candidateId` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:320](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L320) |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictAuditDecision`](/api/@graphorin/memory/type-aliases/ConflictAuditDecision.md) | [packages/memory/src/internal/storage-adapter.ts:322](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L322) |
| <a id="property-detectedby"></a> `detectedBy?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:327](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L327) |
| <a id="property-detectionzone"></a> `detectionZone?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:324](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L324) |
| <a id="property-existingid"></a> `existingId?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:321](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L321) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:326](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L326) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | [packages/memory/src/internal/storage-adapter.ts:319](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L319) |
| <a id="property-similarity"></a> `similarity?` | `readonly` | `number` | [packages/memory/src/internal/storage-adapter.ts:325](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L325) |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictAuditStage`](/api/@graphorin/memory/type-aliases/ConflictAuditStage.md) | [packages/memory/src/internal/storage-adapter.ts:323](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L323) |
