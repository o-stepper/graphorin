[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteMemoryStore

# Class: SqliteMemoryStore

Defined in: [packages/store-sqlite/src/memory-store.ts:191](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L191)

Default `MemoryStore` implementation backed by SQLite + sqlite-vec.

## Stable

## Implements

- [`MemoryStoreExt`](/api/@graphorin/core/interfaces/MemoryStoreExt.md)

## Constructors

### Constructor

```ts
new SqliteMemoryStore(conn, embeddings): SqliteMemoryStore;
```

Defined in: [packages/store-sqlite/src/memory-store.ts:210](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L210)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |
| `embeddings` | [`EmbeddingMetaRepository`](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md) |

#### Returns

`SqliteMemoryStore`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflicts"></a> `conflicts` | `readonly` | [`SqliteConflictStore`](/api/@graphorin/store-sqlite/classes/SqliteConflictStore.md) | - | [packages/store-sqlite/src/memory-store.ts:203](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L203) |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`SqliteConsolidatorStateStore`](/api/@graphorin/store-sqlite/classes/SqliteConsolidatorStateStore.md) | - | [packages/store-sqlite/src/memory-store.ts:204](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L204) |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md) | - | [packages/store-sqlite/src/memory-store.ts:199](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L199) |
| <a id="property-graph"></a> `graph` | `readonly` | `SqliteGraphStore` | Lightweight relation-graph surface (P2-1): entities + one-hop CTE. | [packages/store-sqlite/src/memory-store.ts:208](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L208) |
| <a id="property-insights"></a> `insights` | `readonly` | `SqliteInsightStore` | Reflection insight surface (P1-1). FTS-only; no per-embedder vec0 table. | [packages/store-sqlite/src/memory-store.ts:206](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L206) |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md) | - | [packages/store-sqlite/src/memory-store.ts:201](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L201) |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md) | - | [packages/store-sqlite/src/memory-store.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L200) |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md) | - | [packages/store-sqlite/src/memory-store.ts:198](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L198) |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemoryStore`](/api/@graphorin/core/interfaces/SharedMemoryStore.md) | - | [packages/store-sqlite/src/memory-store.ts:202](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L202) |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemoryStore`](/api/@graphorin/core/interfaces/WorkingMemoryStore.md) | - | [packages/store-sqlite/src/memory-store.ts:197](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L197) |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: [packages/store-sqlite/src/memory-store.ts:231](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L231)

Cleanly close any underlying handles. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`MemoryStoreExt`](/api/@graphorin/core/interfaces/MemoryStoreExt.md).[`close`](/api/@graphorin/core/interfaces/MemoryStoreExt.md#close)

***

### embeddingMetaRepository()

```ts
embeddingMetaRepository(): EmbeddingMetaRepository;
```

Defined in: [packages/store-sqlite/src/memory-store.ts:241](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L241)

Surfaced for tests and the consolidator.

#### Returns

[`EmbeddingMetaRepository`](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md)

***

### init()

```ts
init(): Promise<void>;
```

Defined in: [packages/store-sqlite/src/memory-store.ts:226](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L226)

Initialize / migrate the underlying storage. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`MemoryStoreExt`](/api/@graphorin/core/interfaces/MemoryStoreExt.md).[`init`](/api/@graphorin/core/interfaces/MemoryStoreExt.md#init)

***

### pruneHistory()

```ts
pruneHistory(olderThanMs): Promise<number>;
```

Defined in: [packages/store-sqlite/src/memory-store.ts:254](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L254)

store-04: retention prune for the `memory_history` audit trail -
without one the table grows unboundedly (every supersede /
quarantine transition appends). Deletes rows older than
`olderThanMs`; returns the number pruned. Operators call this from
their own maintenance schedule; nothing prunes automatically.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `olderThanMs` | `number` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Stable

#### Implementation of

[`MemoryStoreExt`](/api/@graphorin/core/interfaces/MemoryStoreExt.md).[`pruneHistory`](/api/@graphorin/core/interfaces/MemoryStoreExt.md#prunehistory)

***

### vectorTableManager()

```ts
vectorTableManager(): VectorTableManager;
```

Defined in: [packages/store-sqlite/src/memory-store.ts:236](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L236)

Surfaced for tests and the consolidator.

#### Returns

[`VectorTableManager`](/api/@graphorin/store-sqlite/classes/VectorTableManager.md)
