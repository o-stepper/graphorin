[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteCheckpointStore

# Class: SqliteCheckpointStore

Defined in: packages/store-sqlite/src/checkpoint-store.ts:18

Default `CheckpointStore` implementation. Workflow state is encoded
as JSON blobs; per-task pending writes survive partial step failure.

## Stable

## Implements

- [`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md)

## Constructors

### Constructor

```ts
new SqliteCheckpointStore(conn): SqliteCheckpointStore;
```

Defined in: packages/store-sqlite/src/checkpoint-store.ts:20

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteCheckpointStore`

## Methods

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: packages/store-sqlite/src/checkpoint-store.ts:132

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`deleteThread`](/api/@graphorin/core/interfaces/CheckpointStore.md#deletethread)

***

### getTuple()

```ts
getTuple(
   threadId, 
   namespace, 
   checkpointId?): Promise<
  | CheckpointTuple
| null>;
```

Defined in: packages/store-sqlite/src/checkpoint-store.ts:74

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpointId?` | `string` |

#### Returns

`Promise`\<
  \| [`CheckpointTuple`](/api/@graphorin/core/interfaces/CheckpointTuple.md)
  \| `null`\>

#### Implementation of

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`getTuple`](/api/@graphorin/core/interfaces/CheckpointStore.md#gettuple)

***

### list()

```ts
list(
   threadId, 
   namespace, 
opts?): AsyncIterable<CheckpointTuple>;
```

Defined in: packages/store-sqlite/src/checkpoint-store.ts:109

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/core/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\&lt;[`CheckpointTuple`](/api/@graphorin/core/interfaces/CheckpointTuple.md)\&gt;

#### Implementation of

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`list`](/api/@graphorin/core/interfaces/CheckpointStore.md#list)

***

### put()

```ts
put(
   threadId, 
   namespace, 
   checkpoint, 
metadata): Promise<string>;
```

Defined in: packages/store-sqlite/src/checkpoint-store.ts:24

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpoint` | [`Checkpoint`](/api/@graphorin/core/interfaces/Checkpoint.md) |
| `metadata` | [`CheckpointMetadata`](/api/@graphorin/core/interfaces/CheckpointMetadata.md) |

#### Returns

`Promise`\&lt;`string`\&gt;

#### Implementation of

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`put`](/api/@graphorin/core/interfaces/CheckpointStore.md#put)

***

### putWrites()

```ts
putWrites(
   threadId, 
   namespace, 
   checkpointId, 
   writes, 
taskId): Promise<void>;
```

Defined in: packages/store-sqlite/src/checkpoint-store.ts:53

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpointId` | `string` |
| `writes` | readonly [`PendingWrite`](/api/@graphorin/core/interfaces/PendingWrite.md)[] |
| `taskId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`putWrites`](/api/@graphorin/core/interfaces/CheckpointStore.md#putwrites)
