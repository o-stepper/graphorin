[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [checkpoint-store-memory](/api/@graphorin/workflow/checkpoint-store-memory/index.md) / InMemoryCheckpointStore

# Class: InMemoryCheckpointStore

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L36)

Pure in-memory `CheckpointStore` implementation. Thread-safe
within a single Node.js event loop because every mutation is
synchronous; concurrent runs that share the same instance will see
a consistent view.

## Stable

## Implements

- [`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md)

## Constructors

### Constructor

```ts
new InMemoryCheckpointStore(): InMemoryCheckpointStore;
```

#### Returns

`InMemoryCheckpointStore`

## Methods

### compactThread()

```ts
compactThread(
   threadId, 
   namespace, 
keepLast): Promise<number>;
```

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:230](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L230)

W-009 compaction - keep the `keepLast` newest checkpoints of one pair.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `keepLast` | `number` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`compactThread`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#compactthread)

***

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:156](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L156)

Full erasure primitive: delete every checkpoint and pending write of
this thread across ALL namespaces. Namespace-blind by contract -
retention sweeps must use [CheckpointStoreExt.pruneThreads](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#prunethreads)
instead, which is namespace-scoped and protects suspended threads.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`deleteThread`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#deletethread)

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

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L96)

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

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`getTuple`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#gettuple)

***

### list()

```ts
list(
   threadId, 
   namespace, 
opts?): AsyncIterable<CheckpointTuple>;
```

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L120)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/workflow/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\&lt;[`CheckpointTuple`](/api/@graphorin/workflow/interfaces/CheckpointTuple.md)\&gt;

#### Implementation of

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`list`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#list)

***

### listSuspended()

```ts
listSuspended(namespace, opts?): Promise<readonly {
  threadId: string;
  wakeAt: number;
}[]>;
```

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:173](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L173)

W-032: enumerate threads whose LATEST checkpoint in `namespace` is
suspended with a due `wakeAt` - parity with the SQLite adapter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `namespace` | `string` |
| `opts?` | \{ `dueBefore?`: `number`; `limit?`: `number`; \} |
| `opts.dueBefore?` | `number` |
| `opts.limit?` | `number` |

#### Returns

`Promise`\<readonly \{
  `threadId`: `string`;
  `wakeAt`: `number`;
\}[]\>

#### Implementation of

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`listSuspended`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#listsuspended)

***

### pruneThreads()

```ts
pruneThreads(opts): Promise<number>;
```

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:201](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L201)

W-009 retention sweep - parity with the SQLite implementation:
namespace-SCOPED (entries key as `threadId::namespace`), latest
checkpoint decides age + status, suspended pairs survive unless
`onlyTerminal: false`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`PruneThreadsOptions`](/api/@graphorin/core/interfaces/PruneThreadsOptions.md) |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`pruneThreads`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#prunethreads)

***

### put()

```ts
put(
   threadId, 
   namespace, 
   checkpoint, 
   metadata, 
opts?): Promise<string>;
```

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L40)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpoint` | [`Checkpoint`](/api/@graphorin/workflow/interfaces/Checkpoint.md) |
| `metadata` | [`CheckpointMetadata`](/api/@graphorin/workflow/interfaces/CheckpointMetadata.md) |
| `opts?` | [`CheckpointPutOptions`](/api/@graphorin/core/interfaces/CheckpointPutOptions.md) |

#### Returns

`Promise`\&lt;`string`\&gt;

#### Implementation of

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`put`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#put)

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

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L74)

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

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`putWrites`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#putwrites)

***

### size()

```ts
size(): number;
```

Defined in: [packages/workflow/src/checkpoint-store-memory.ts:254](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/checkpoint-store-memory.ts#L254)

Test-only helper that exposes the raw count of stored checkpoints
- handy for assertions like "the runtime wrote exactly N
checkpoints across the run".

#### Returns

`number`
