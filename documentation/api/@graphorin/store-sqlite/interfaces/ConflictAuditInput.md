[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConflictAuditInput

# Interface: ConflictAuditInput

Defined in: packages/store-sqlite/src/conflict-store.ts:54

**`Stable`**

Per-decision row written by `runConflictPipeline(...)`. One row per
`SemanticMemory.remember(...)` invocation, even when no conflict was
detected (so operators can audit pipeline coverage).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-candidateid"></a> `candidateId` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:56 |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictPipelineDecision`](/api/@graphorin/store-sqlite/type-aliases/ConflictPipelineDecision.md) | - | packages/store-sqlite/src/conflict-store.ts:58 |
| <a id="property-detectedby"></a> `detectedBy?` | `readonly` | `string` | Defaults to `'sync-write'`. Future LLM judge will pass `'consolidator-deep'`. | packages/store-sqlite/src/conflict-store.ts:66 |
| <a id="property-detectionzone"></a> `detectionZone?` | `readonly` | `string` | `'hot' | 'near-dup' | 'conflict-check' | 'cold' | 'heuristic' | 'subject-predicate'` (Stage 2/3/4). | packages/store-sqlite/src/conflict-store.ts:61 |
| <a id="property-existingid"></a> `existingId?` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:57 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:64 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/store-sqlite/src/conflict-store.ts:55 |
| <a id="property-similarity"></a> `similarity?` | `readonly` | `number` | Cosine similarity captured during Stage 2. `null` for non-embedding stages. | packages/store-sqlite/src/conflict-store.ts:63 |
| <a id="property-stage"></a> `stage` | `readonly` | [`ConflictPipelineStage`](/api/@graphorin/store-sqlite/type-aliases/ConflictPipelineStage.md) | - | packages/store-sqlite/src/conflict-store.ts:59 |
