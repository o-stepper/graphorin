[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / EmbedderMigrationStateRow

# Interface: EmbedderMigrationStateRow

Defined in: packages/store-sqlite/src/embedder-migration-support.ts:27

One persisted migration-state row (schema 001, revived in wave-D D5).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/embedder-migration-support.ts:39 |
| <a id="property-finishedat"></a> `finishedAt` | `readonly` | `number` \| `null` | - | packages/store-sqlite/src/embedder-migration-support.ts:38 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/store-sqlite/src/embedder-migration-support.ts:28 |
| <a id="property-lastrecordid"></a> `lastRecordId` | `readonly` | `string` \| `null` | Composite resumable cursor: `<kind>:<cursor>` (kind ∈ fact|episode|message). | packages/store-sqlite/src/embedder-migration-support.ts:36 |
| <a id="property-processed"></a> `processed` | `readonly` | `number` | - | packages/store-sqlite/src/embedder-migration-support.ts:34 |
| <a id="property-sourceembedder"></a> `sourceEmbedder` | `readonly` | `string` | - | packages/store-sqlite/src/embedder-migration-support.ts:29 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `number` | - | packages/store-sqlite/src/embedder-migration-support.ts:37 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"failed"` \| `"aborted"` \| `"committed"` | - | packages/store-sqlite/src/embedder-migration-support.ts:32 |
| <a id="property-strategy"></a> `strategy` | `readonly` | `string` | - | packages/store-sqlite/src/embedder-migration-support.ts:31 |
| <a id="property-targetembedder"></a> `targetEmbedder` | `readonly` | `string` | - | packages/store-sqlite/src/embedder-migration-support.ts:30 |
| <a id="property-totalrecords"></a> `totalRecords` | `readonly` | `number` | - | packages/store-sqlite/src/embedder-migration-support.ts:33 |
