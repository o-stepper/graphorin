[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / GraphorinSqliteStore

# Interface: GraphorinSqliteStore

Defined in: packages/store-sqlite/src/index.ts:192

Composite handle returned by [createSqliteStore](/api/@graphorin/store-sqlite/functions/createSqliteStore.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-appliedmigrations"></a> `appliedMigrations` | `readonly` | readonly [`AppliedMigration`](/api/@graphorin/store-sqlite/interfaces/AppliedMigration.md)[] | packages/store-sqlite/src/index.ts:202 |
| <a id="property-authtokens"></a> `authTokens` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | packages/store-sqlite/src/index.ts:197 |
| <a id="property-checkpoints"></a> `checkpoints` | `readonly` | [`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md) | packages/store-sqlite/src/index.ts:194 |
| <a id="property-connection"></a> `connection` | `readonly` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) | packages/store-sqlite/src/index.ts:201 |
| <a id="property-embeddings"></a> `embeddings` | `readonly` | [`EmbeddingMetaRepository`](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md) | packages/store-sqlite/src/index.ts:200 |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md) | packages/store-sqlite/src/index.ts:199 |
| <a id="property-memory"></a> `memory` | `readonly` | [`MemoryStoreExt`](/api/@graphorin/core/interfaces/MemoryStoreExt.md) | packages/store-sqlite/src/index.ts:193 |
| <a id="property-oauthservers"></a> `oauthServers` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | packages/store-sqlite/src/index.ts:198 |
| <a id="property-sessions"></a> `sessions` | `readonly` | [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md) | packages/store-sqlite/src/index.ts:195 |
| <a id="property-triggers"></a> `triggers` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | packages/store-sqlite/src/index.ts:196 |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/store-sqlite/src/index.ts:206

Close the connection + stop the checkpoint manager. Idempotent.

#### Returns

`Promise`\<`void`\>

***

### init()

```ts
init(): Promise<void>;
```

Defined in: packages/store-sqlite/src/index.ts:204

Initialize the store: run migrations + start checkpoint manager.

#### Returns

`Promise`\<`void`\>
