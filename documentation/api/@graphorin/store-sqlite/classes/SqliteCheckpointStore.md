[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteCheckpointStore

# Class: SqliteCheckpointStore

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L23)

Default `CheckpointStore` implementation (including the W-009
`CheckpointStoreExt` retention primitives). Workflow state is
encoded as JSON blobs; per-task pending writes survive partial step
failure.

## Stable

## Implements

- [`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md)

## Constructors

### Constructor

```ts
new SqliteCheckpointStore(conn): SqliteCheckpointStore;
```

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L25)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteCheckpointStore`

## Methods

### compactThread()

```ts
compactThread(
   threadId, 
   namespace, 
keepLast): Promise<number>;
```

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:260](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L260)

W-009 compaction: keep only the `keepLast` newest checkpoints (by
step_number) of one `(thread_id, namespace)` pair. Resume reads the
latest tuple, so `keepLast >= 1` never breaks resumability; the
oldest surviving checkpoint's parent_id may point at a deleted row,
which getTuple/list never resolve and the CAS compares only the
latest id - safe, but time-travel/fork targets are gone.

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

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L200)

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

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L109)

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

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`getTuple`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#gettuple)

***

### list()

```ts
list(
   threadId, 
   namespace, 
opts?): AsyncIterable<CheckpointTuple>;
```

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:177](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L177)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/core/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\&lt;[`CheckpointTuple`](/api/@graphorin/core/interfaces/CheckpointTuple.md)\&gt;

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

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L150)

W-032: enumerate threads whose LATEST checkpoint in `namespace` is
suspended with a due `wake_at`. Latest-per-thread is decided by max
step_number (the same policy as `getTuple`), so a thread whose
newest checkpoint moved on (resumed / completed) never fires.

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

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:222](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L222)

W-009 retention sweep. Policy: a `(thread_id, namespace)` pair
qualifies when its LATEST checkpoint (by step_number) is older than
the cutoff and - unless `onlyTerminal: false` - terminal
('completed' / 'failed' / 'aborted'); suspended pairs hold live
HITL approvals / awakeables and are protected by default.

CRITICAL: never delegates to `deleteThread` - that primitive is
namespace-blind, and with a reused threadId (e.g. a sessionId used
by two workflows) pruning workflow A's terminal thread would erase
workflow B's suspended checkpoints, breaking the onlyTerminal
guarantee. Each qualifying pair is deleted with namespace-scoped
statements in its own transaction so a long sweep never holds the
writer lock across the whole table.

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

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L29)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpoint` | [`Checkpoint`](/api/@graphorin/core/interfaces/Checkpoint.md) |
| `metadata` | [`CheckpointMetadata`](/api/@graphorin/core/interfaces/CheckpointMetadata.md) |
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

Defined in: [packages/store-sqlite/src/checkpoint-store.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/checkpoint-store.ts#L88)

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

[`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md).[`putWrites`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#putwrites)
