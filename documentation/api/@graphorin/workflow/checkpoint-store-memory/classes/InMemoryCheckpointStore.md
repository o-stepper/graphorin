[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [checkpoint-store-memory](/api/@graphorin/workflow/checkpoint-store-memory/index.md) / InMemoryCheckpointStore

# Class: InMemoryCheckpointStore

Defined in: packages/workflow/src/checkpoint-store-memory.ts:33

Pure in-memory [CheckpointStore](/api/@graphorin/workflow/interfaces/CheckpointStore.md) implementation. Thread-safe
within a single Node.js event loop because every mutation is
synchronous; concurrent runs that share the same instance will see
a consistent view.

## Stable

## Implements

- [`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md)

## Constructors

### Constructor

```ts
new InMemoryCheckpointStore(): InMemoryCheckpointStore;
```

#### Returns

`InMemoryCheckpointStore`

## Methods

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: packages/workflow/src/checkpoint-store-memory.ts:141

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md).[`deleteThread`](/api/@graphorin/workflow/interfaces/CheckpointStore.md#deletethread)

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

Defined in: packages/workflow/src/checkpoint-store-memory.ts:81

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpointId?` | `string` |

#### Returns

`Promise`\<
  \| [`CheckpointTuple`](/api/@graphorin/workflow/interfaces/CheckpointTuple.md)
  \| `null`\>

#### Implementation of

[`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md).[`getTuple`](/api/@graphorin/workflow/interfaces/CheckpointStore.md#gettuple)

***

### list()

```ts
list(
   threadId, 
   namespace, 
opts?): AsyncIterable<CheckpointTuple>;
```

Defined in: packages/workflow/src/checkpoint-store-memory.ts:105

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/workflow/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\&lt;[`CheckpointTuple`](/api/@graphorin/workflow/interfaces/CheckpointTuple.md)\&gt;

#### Implementation of

[`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md).[`list`](/api/@graphorin/workflow/interfaces/CheckpointStore.md#list)

***

### put()

```ts
put(
   threadId, 
   namespace, 
   checkpoint, 
metadata): Promise<string>;
```

Defined in: packages/workflow/src/checkpoint-store-memory.ts:37

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpoint` | [`Checkpoint`](/api/@graphorin/workflow/interfaces/Checkpoint.md) |
| `metadata` | [`CheckpointMetadata`](/api/@graphorin/workflow/interfaces/CheckpointMetadata.md) |

#### Returns

`Promise`\&lt;`string`\&gt;

#### Implementation of

[`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md).[`put`](/api/@graphorin/workflow/interfaces/CheckpointStore.md#put)

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

Defined in: packages/workflow/src/checkpoint-store-memory.ts:59

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpointId` | `string` |
| `writes` | readonly [`PendingWrite`](/api/@graphorin/workflow/interfaces/PendingWrite.md)[] |
| `taskId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md).[`putWrites`](/api/@graphorin/workflow/interfaces/CheckpointStore.md#putwrites)

***

### size()

```ts
size(): number;
```

Defined in: packages/workflow/src/checkpoint-store-memory.ts:159

Test-only helper that exposes the raw count of stored checkpoints
— handy for assertions like "the runtime wrote exactly N
checkpoints across the run".

#### Returns

`number`
