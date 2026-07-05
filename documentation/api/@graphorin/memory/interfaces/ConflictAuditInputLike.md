[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictAuditInputLike

# Interface: ConflictAuditInputLike

Defined in: packages/memory/src/internal/storage-adapter.ts:280

Single audit row written by `runConflictPipeline(...)`. The optional
`ConflictMemoryStoreExt.recordDecision` accepts this shape; the
default `@graphorin/store-sqlite` implementation persists it into
the `fact_conflicts` table introduced by Phase 10b.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-candidateid"></a> `candidateId` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:282 |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictAuditDecision`](/api/@graphorin/memory/type-aliases/ConflictAuditDecision.md) | packages/memory/src/internal/storage-adapter.ts:284 |
| <a id="property-detectedby"></a> `detectedBy?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:289 |
| <a id="property-detectionzone"></a> `detectionZone?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:286 |
| <a id="property-existingid"></a> `existingId?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:283 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:288 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/internal/storage-adapter.ts:281 |
| <a id="property-similarity"></a> `similarity?` | `readonly` | `number` | packages/memory/src/internal/storage-adapter.ts:287 |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictAuditStage`](/api/@graphorin/memory/type-aliases/ConflictAuditStage.md) | packages/memory/src/internal/storage-adapter.ts:285 |
