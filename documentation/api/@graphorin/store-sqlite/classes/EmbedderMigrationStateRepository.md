[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / EmbedderMigrationStateRepository

# Class: EmbedderMigrationStateRepository

Defined in: packages/store-sqlite/src/embedder-migration-support.ts:49

**`Stable`**

Persisted cursor store over `migration_state`. Structurally matches
the runner's `MigrationStateStoreLike` contract in
`@graphorin/memory` (the memory package never imports this class).

## Constructors

### Constructor

```ts
new EmbedderMigrationStateRepository(conn): EmbedderMigrationStateRepository;
```

Defined in: packages/store-sqlite/src/embedder-migration-support.ts:52

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`EmbedderMigrationStateRepository`

## Methods

### create()

```ts
create(state): Promise<void>;
```

Defined in: packages/store-sqlite/src/embedder-migration-support.ts:96

Insert a fresh `running` row.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | \{ `id`: `string`; `sourceEmbedder`: `string`; `strategy`: `string`; `targetEmbedder`: `string`; `totalRecords`: `number`; \} |
| `state.id` | `string` |
| `state.sourceEmbedder` | `string` |
| `state.strategy` | `string` |
| `state.targetEmbedder` | `string` |
| `state.totalRecords` | `number` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### findResumable()

```ts
findResumable(sourceEmbedder, targetEmbedder): Promise<
  | EmbedderMigrationStateRow
| null>;
```

Defined in: packages/store-sqlite/src/embedder-migration-support.ts:57

The most recent RESUMABLE row (running/aborted) for the pair, or null.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceEmbedder` | `string` |
| `targetEmbedder` | `string` |

#### Returns

`Promise`\<
  \| [`EmbedderMigrationStateRow`](/api/@graphorin/store-sqlite/interfaces/EmbedderMigrationStateRow.md)
  \| `null`\>

***

### update()

```ts
update(id, patch): Promise<void>;
```

Defined in: packages/store-sqlite/src/embedder-migration-support.ts:120

Advance / settle the row.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `patch` | \{ `errorMessage?`: `string` \| `null`; `lastRecordId?`: `string` \| `null`; `processed?`: `number`; `status?`: `"running"` \| `"failed"` \| `"aborted"` \| `"committed"`; \} |
| `patch.errorMessage?` | `string` \| `null` |
| `patch.lastRecordId?` | `string` \| `null` |
| `patch.processed?` | `number` |
| `patch.status?` | `"running"` \| `"failed"` \| `"aborted"` \| `"committed"` |

#### Returns

`Promise`\&lt;`void`\&gt;
