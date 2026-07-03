[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteMemoryStore

# Class: SqliteMemoryStore

Defined in: packages/store-sqlite/src/memory-store.ts:121

Default `MemoryStore` implementation backed by SQLite + sqlite-vec.

## Stable

## Implements

- [`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md)

## Constructors

### Constructor

```ts
new SqliteMemoryStore(conn, embeddings): SqliteMemoryStore;
```

Defined in: packages/store-sqlite/src/memory-store.ts:139

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
| <a id="property-conflicts"></a> `conflicts` | `readonly` | [`SqliteConflictStore`](/api/@graphorin/store-sqlite/classes/SqliteConflictStore.md) | - | packages/store-sqlite/src/memory-store.ts:132 |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`SqliteConsolidatorStateStore`](/api/@graphorin/store-sqlite/classes/SqliteConsolidatorStateStore.md) | - | packages/store-sqlite/src/memory-store.ts:133 |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md) | - | packages/store-sqlite/src/memory-store.ts:128 |
| <a id="property-graph"></a> `graph` | `readonly` | `SqliteGraphStore` | Lightweight relation-graph surface (P2-1): entities + one-hop CTE. | packages/store-sqlite/src/memory-store.ts:137 |
| <a id="property-insights"></a> `insights` | `readonly` | `SqliteInsightStore` | Reflection insight surface (P1-1). FTS-only; no per-embedder vec0 table. | packages/store-sqlite/src/memory-store.ts:135 |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemoryStore`](/api/@graphorin/core/interfaces/ProceduralMemoryStore.md) | - | packages/store-sqlite/src/memory-store.ts:130 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md) | - | packages/store-sqlite/src/memory-store.ts:129 |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md) | - | packages/store-sqlite/src/memory-store.ts:127 |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemoryStore`](/api/@graphorin/core/interfaces/SharedMemoryStore.md) | - | packages/store-sqlite/src/memory-store.ts:131 |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemoryStore`](/api/@graphorin/core/interfaces/WorkingMemoryStore.md) | - | packages/store-sqlite/src/memory-store.ts:126 |

## Methods

### close()

```ts
close(): Promise<void>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:159

Cleanly close any underlying handles. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`close`](/api/@graphorin/core/interfaces/MemoryStore.md#close)

***

### embeddingMetaRepository()

```ts
embeddingMetaRepository(): EmbeddingMetaRepository;
```

Defined in: packages/store-sqlite/src/memory-store.ts:169

Surfaced for tests and the consolidator.

#### Returns

[`EmbeddingMetaRepository`](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md)

***

### init()

```ts
init(): Promise<void>;
```

Defined in: packages/store-sqlite/src/memory-store.ts:154

Initialize / migrate the underlying storage. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`MemoryStore`](/api/@graphorin/core/interfaces/MemoryStore.md).[`init`](/api/@graphorin/core/interfaces/MemoryStore.md#init)

***

### vectorTableManager()

```ts
vectorTableManager(): VectorTableManager;
```

Defined in: packages/store-sqlite/src/memory-store.ts:164

Surfaced for tests and the consolidator.

#### Returns

[`VectorTableManager`](/api/@graphorin/store-sqlite/classes/VectorTableManager.md)
