[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictAuditInputLike

# Interface: ConflictAuditInputLike

Defined in: [packages/memory/src/internal/storage-adapter.ts:353](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L353)

Single audit row written by `runConflictPipeline(...)`. The optional
`ConflictMemoryStoreExt.recordDecision` accepts this shape; the
default `@graphorin/store-sqlite` implementation persists it into
the `fact_conflicts` table introduced by Phase 10b.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-candidateid"></a> `candidateId` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:355](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L355) |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictAuditDecision`](/api/@graphorin/memory/type-aliases/ConflictAuditDecision.md) | [packages/memory/src/internal/storage-adapter.ts:357](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L357) |
| <a id="property-detectedby"></a> `detectedBy?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:362](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L362) |
| <a id="property-detectionzone"></a> `detectionZone?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:359](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L359) |
| <a id="property-existingid"></a> `existingId?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:356](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L356) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:361](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L361) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | [packages/memory/src/internal/storage-adapter.ts:354](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L354) |
| <a id="property-similarity"></a> `similarity?` | `readonly` | `number` | [packages/memory/src/internal/storage-adapter.ts:360](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L360) |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictAuditStage`](/api/@graphorin/memory/type-aliases/ConflictAuditStage.md) | [packages/memory/src/internal/storage-adapter.ts:358](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L358) |
