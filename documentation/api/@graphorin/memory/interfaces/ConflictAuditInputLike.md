[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictAuditInputLike

# Interface: ConflictAuditInputLike

Defined in: packages/memory/src/internal/storage-adapter.ts:353

**`Stable`**

Single audit row written by `runConflictPipeline(...)`. The optional
`ConflictMemoryStoreExt.recordDecision` accepts this shape; the
default `@graphorin/store-sqlite` implementation persists it into
the `fact_conflicts` table introduced by Phase 10b.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-candidateid"></a> `candidateId` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:355 |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictAuditDecision`](/api/@graphorin/memory/type-aliases/ConflictAuditDecision.md) | packages/memory/src/internal/storage-adapter.ts:357 |
| <a id="property-detectedby"></a> `detectedBy?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:362 |
| <a id="property-detectionzone"></a> `detectionZone?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:359 |
| <a id="property-existingid"></a> `existingId?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:356 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:361 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/internal/storage-adapter.ts:354 |
| <a id="property-similarity"></a> `similarity?` | `readonly` | `number` | packages/memory/src/internal/storage-adapter.ts:360 |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictAuditStage`](/api/@graphorin/memory/type-aliases/ConflictAuditStage.md) | packages/memory/src/internal/storage-adapter.ts:358 |
