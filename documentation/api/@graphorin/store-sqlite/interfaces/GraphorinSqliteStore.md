[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / GraphorinSqliteStore

# Interface: GraphorinSqliteStore

Defined in: [packages/store-sqlite/src/index.ts:208](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L208)

Composite handle returned by [createSqliteStore](/api/@graphorin/store-sqlite/functions/createSqliteStore.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-appliedmigrations"></a> `appliedMigrations` | `readonly` | readonly [`AppliedMigration`](/api/@graphorin/store-sqlite/interfaces/AppliedMigration.md)[] | - | [packages/store-sqlite/src/index.ts:219](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L219) |
| <a id="property-authtokens"></a> `authTokens` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | - | [packages/store-sqlite/src/index.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L214) |
| <a id="property-checkpoints"></a> `checkpoints` | `readonly` | [`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md) | - | [packages/store-sqlite/src/index.ts:210](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L210) |
| <a id="property-connection"></a> `connection` | `readonly` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) | - | [packages/store-sqlite/src/index.ts:218](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L218) |
| <a id="property-embeddermigration"></a> `embedderMigration` | `readonly` | \{ `nextBatch`: (`args`) => `Promise`\&lt;\{ `nextCursor`: `string` \| `null`; `rows`: readonly `BatcherRow`[]; \}\&gt;; `state`: [`EmbedderMigrationStateRepository`](/api/@graphorin/store-sqlite/classes/EmbedderMigrationStateRepository.md); `dropRetiredVectorTables`: \{ `dropped`: readonly `string`[]; \}; \} | Wave-D D5 (MST-12): store-side embedder-migration support - the persisted resumable cursor over `migration_state`, the `nextBatch` pager the `@graphorin/memory` runner consumes (structural match), and the retired-vec-table space reclaim. | [packages/store-sqlite/src/index.ts:226](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L226) |
| `embedderMigration.nextBatch` | `readonly` | (`args`) => `Promise`\&lt;\{ `nextCursor`: `string` \| `null`; `rows`: readonly `BatcherRow`[]; \}\&gt; | - | [packages/store-sqlite/src/index.ts:228](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L228) |
| `embedderMigration.state` | `readonly` | [`EmbedderMigrationStateRepository`](/api/@graphorin/store-sqlite/classes/EmbedderMigrationStateRepository.md) | - | [packages/store-sqlite/src/index.ts:227](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L227) |
| `embedderMigration.dropRetiredVectorTables` | `public` | \{ `dropped`: readonly `string`[]; \} | - | [packages/store-sqlite/src/index.ts:229](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L229) |
| <a id="property-embeddings"></a> `embeddings` | `readonly` | [`EmbeddingMetaRepository`](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md) | - | [packages/store-sqlite/src/index.ts:217](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L217) |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md) | - | [packages/store-sqlite/src/index.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L216) |
| <a id="property-memory"></a> `memory` | `readonly` | [`MemoryStoreExt`](/api/@graphorin/core/interfaces/MemoryStoreExt.md) | - | [packages/store-sqlite/src/index.ts:209](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L209) |
| <a id="property-oauthservers"></a> `oauthServers` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | - | [packages/store-sqlite/src/index.ts:215](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L215) |
| <a id="property-pairing"></a> `pairing` | `readonly` | [`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md) | - | [packages/store-sqlite/src/index.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L213) |
| <a id="property-sessions"></a> `sessions` | `readonly` | [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md) | - | [packages/store-sqlite/src/index.ts:211](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L211) |
| <a id="property-triggers"></a> `triggers` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | - | [packages/store-sqlite/src/index.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L212) |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: [packages/store-sqlite/src/index.ts:234](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L234)

Close the connection + stop the checkpoint manager. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### init()

```ts
init(): Promise<void>;
```

Defined in: [packages/store-sqlite/src/index.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L232)

Initialize the store: run migrations + start checkpoint manager.

#### Returns

`Promise`\&lt;`void`\&gt;
