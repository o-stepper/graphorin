[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictAuditInputLike

# Interface: ConflictAuditInputLike

Defined in: [packages/memory/src/internal/storage-adapter.ts:303](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L303)

Single audit row written by `runConflictPipeline(...)`. The optional
`ConflictMemoryStoreExt.recordDecision` accepts this shape; the
default `@graphorin/store-sqlite` implementation persists it into
the `fact_conflicts` table introduced by Phase 10b.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-candidateid"></a> `candidateId` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:305](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L305) |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictAuditDecision`](/api/@graphorin/memory/type-aliases/ConflictAuditDecision.md) | [packages/memory/src/internal/storage-adapter.ts:307](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L307) |
| <a id="property-detectedby"></a> `detectedBy?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:312](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L312) |
| <a id="property-detectionzone"></a> `detectionZone?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:309](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L309) |
| <a id="property-existingid"></a> `existingId?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:306](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L306) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:311](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L311) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | [packages/memory/src/internal/storage-adapter.ts:304](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L304) |
| <a id="property-similarity"></a> `similarity?` | `readonly` | `number` | [packages/memory/src/internal/storage-adapter.ts:310](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L310) |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictAuditStage`](/api/@graphorin/memory/type-aliases/ConflictAuditStage.md) | [packages/memory/src/internal/storage-adapter.ts:308](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L308) |
