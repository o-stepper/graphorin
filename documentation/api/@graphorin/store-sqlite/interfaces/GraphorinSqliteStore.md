[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / GraphorinSqliteStore

# Interface: GraphorinSqliteStore

Defined in: packages/store-sqlite/src/index.ts:213

**`Stable`**

Composite handle returned by [createSqliteStore](/api/@graphorin/store-sqlite/functions/createSqliteStore.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-appliedmigrations"></a> `appliedMigrations` | `readonly` | readonly [`AppliedMigration`](/api/@graphorin/store-sqlite/interfaces/AppliedMigration.md)[] | - | packages/store-sqlite/src/index.ts:230 |
| <a id="property-authtokens"></a> `authTokens` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | - | packages/store-sqlite/src/index.ts:219 |
| <a id="property-checkpoints"></a> `checkpoints` | `readonly` | [`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md) | - | packages/store-sqlite/src/index.ts:215 |
| <a id="property-connection"></a> `connection` | `readonly` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) | - | packages/store-sqlite/src/index.ts:229 |
| <a id="property-embeddermigration"></a> `embedderMigration` | `readonly` | \{ `nextBatch`: (`args`) => `Promise`\&lt;\{ `nextCursor`: `string` \| `null`; `rows`: readonly `BatcherRow`[]; \}\&gt;; `state`: [`EmbedderMigrationStateRepository`](/api/@graphorin/store-sqlite/classes/EmbedderMigrationStateRepository.md); `dropRetiredVectorTables`: \{ `dropped`: readonly `string`[]; \}; \} | Store-side embedder-migration support - the persisted resumable cursor over `migration_state`, the `nextBatch` pager the `@graphorin/memory` runner consumes (structural match), and the retired-vec-table space reclaim. | packages/store-sqlite/src/index.ts:237 |
| `embedderMigration.nextBatch` | `readonly` | (`args`) => `Promise`\&lt;\{ `nextCursor`: `string` \| `null`; `rows`: readonly `BatcherRow`[]; \}\&gt; | - | packages/store-sqlite/src/index.ts:239 |
| `embedderMigration.state` | `readonly` | [`EmbedderMigrationStateRepository`](/api/@graphorin/store-sqlite/classes/EmbedderMigrationStateRepository.md) | - | packages/store-sqlite/src/index.ts:238 |
| `embedderMigration.dropRetiredVectorTables` | `public` | \{ `dropped`: readonly `string`[]; \} | - | packages/store-sqlite/src/index.ts:240 |
| <a id="property-embeddings"></a> `embeddings` | `readonly` | [`EmbeddingMetaRepository`](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md) | - | packages/store-sqlite/src/index.ts:228 |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md) | - | packages/store-sqlite/src/index.ts:221 |
| <a id="property-memory"></a> `memory` | `readonly` | [`MemoryStoreExt`](/api/@graphorin/core/interfaces/MemoryStoreExt.md) | - | packages/store-sqlite/src/index.ts:214 |
| <a id="property-oauthservers"></a> `oauthServers` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | - | packages/store-sqlite/src/index.ts:220 |
| <a id="property-pairing"></a> `pairing` | `readonly` | [`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md) | - | packages/store-sqlite/src/index.ts:218 |
| <a id="property-sessions"></a> `sessions` | `readonly` | [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md) | - | packages/store-sqlite/src/index.ts:216 |
| <a id="property-suspendedruns"></a> `suspendedRuns` | `readonly` | [`SuspendedRunStore`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunStore.md) | Durable suspended agent runs (migration 038): the server's `RunStateTracker` persists `awaiting_approval` runs here so the REST resume endpoint survives a process restart. | packages/store-sqlite/src/index.ts:227 |
| <a id="property-triggers"></a> `triggers` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | - | packages/store-sqlite/src/index.ts:217 |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/store-sqlite/src/index.ts:245

Close the connection + stop the checkpoint manager. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### init()

```ts
init(): Promise<void>;
```

Defined in: packages/store-sqlite/src/index.ts:243

Initialize the store: run migrations + start checkpoint manager.

#### Returns

`Promise`\&lt;`void`\&gt;
