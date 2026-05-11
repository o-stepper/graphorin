[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / GraphorinSqliteStore

# Interface: GraphorinSqliteStore

Defined in: packages/store-sqlite/src/index.ts:152

Composite handle returned by [createSqliteStore](/api/@graphorin/store-sqlite/functions/createSqliteStore.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-appliedmigrations"></a> `appliedMigrations` | `readonly` | readonly [`AppliedMigration`](/api/@graphorin/store-sqlite/interfaces/AppliedMigration.md)[] | packages/store-sqlite/src/index.ts:162 |
| <a id="property-authtokens"></a> `authTokens` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | packages/store-sqlite/src/index.ts:157 |
| <a id="property-checkpoints"></a> `checkpoints` | `readonly` | [`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md) | packages/store-sqlite/src/index.ts:154 |
| <a id="property-connection"></a> `connection` | `readonly` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) | packages/store-sqlite/src/index.ts:161 |
| <a id="property-embeddings"></a> `embeddings` | `readonly` | [`EmbeddingMetaRepository`](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md) | packages/store-sqlite/src/index.ts:160 |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md) | packages/store-sqlite/src/index.ts:159 |
| <a id="property-memory"></a> `memory` | `readonly` | [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md) | packages/store-sqlite/src/index.ts:153 |
| <a id="property-oauthservers"></a> `oauthServers` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | packages/store-sqlite/src/index.ts:158 |
| <a id="property-sessions"></a> `sessions` | `readonly` | [`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md) | packages/store-sqlite/src/index.ts:155 |
| <a id="property-triggers"></a> `triggers` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | packages/store-sqlite/src/index.ts:156 |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/store-sqlite/src/index.ts:166

Close the connection + stop the checkpoint manager. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### init()

```ts
init(): Promise<void>;
```

Defined in: packages/store-sqlite/src/index.ts:164

Initialize the store: run migrations + start checkpoint manager.

#### Returns

`Promise`\&lt;`void`\&gt;
