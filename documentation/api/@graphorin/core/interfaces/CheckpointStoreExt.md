[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointStoreExt

# Interface: CheckpointStoreExt

Defined in: packages/core/src/contracts/checkpoint-store.ts:235

Retention extension over [CheckpointStore](/api/@graphorin/core/interfaces/CheckpointStore.md) (W-009). The engine
intentionally never deletes finished threads itself - a completed
thread is still needed for inspection and duplicate-resume refusal;
how long to keep it is an operator decision. These primitives are
what an operator (or a host scheduler) drives.

Additive: third-party `CheckpointStore` implementations compile
unchanged; hosts feature-detect with `'pruneThreads' in store`.

## Stable

## Extends

- [`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md)

## Methods

### compactThread()

```ts
compactThread(
   threadId, 
   namespace, 
keepLast): Promise<number>;
```

Defined in: packages/core/src/contracts/checkpoint-store.ts:255

Keep only the `keepLast` most recent checkpoints (by `stepNumber`)
of one `(threadId, namespace)` pair, deleting older ones together
with their pending writes. `keepLast >= 1`; resume works from the
latest tuple, so compaction never breaks resumability - it does
remove time-travel/fork targets. Returns the number of checkpoints
deleted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `keepLast` | `number` |

#### Returns

`Promise`\<`number`\>

***

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: packages/core/src/contracts/checkpoint-store.ts:184

Full erasure primitive: delete every checkpoint and pending write of
this thread across ALL namespaces. Namespace-blind by contract -
retention sweeps must use [CheckpointStoreExt.pruneThreads](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#prunethreads)
instead, which is namespace-scoped and protects suspended threads.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\<`void`\>

#### Inherited from

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

Defined in: packages/core/src/contracts/checkpoint-store.ts:170

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

#### Inherited from

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`getTuple`](/api/@graphorin/core/interfaces/CheckpointStore.md#gettuple)

***

### list()

```ts
list(
   threadId, 
   namespace, 
opts?): AsyncIterable<CheckpointTuple>;
```

Defined in: packages/core/src/contracts/checkpoint-store.ts:176

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/core/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\<[`CheckpointTuple`](/api/@graphorin/core/interfaces/CheckpointTuple.md)\>

#### Inherited from

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`list`](/api/@graphorin/core/interfaces/CheckpointStore.md#list)

***

### listSuspended()?

```ts
optional listSuspended(namespace, opts?): Promise<readonly {
  threadId: string;
  wakeAt: number;
}[]>;
```

Defined in: packages/core/src/contracts/checkpoint-store.ts:195

W-032: enumerate threads whose LATEST checkpoint in `namespace` is
`suspended` with a due `wakeAt` (`<= opts.dueBefore`, default: any
stamped wakeAt). This is what a durable-timer driver polls -
without it an operator would have to keep an external registry of
sleeping threadIds. OPTIONAL so third-party stores compile
unchanged; `createTimerDriver` throws a typed error when the store
lacks it (deterministic policy, no silent no-op).

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

#### Inherited from

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`listSuspended`](/api/@graphorin/core/interfaces/CheckpointStore.md#listsuspended)

***

### pruneThreads()

```ts
pruneThreads(opts): Promise<number>;
```

Defined in: packages/core/src/contracts/checkpoint-store.ts:245

Namespace-scoped retention sweep: for every `(threadId, namespace)`
pair matching the policy, delete that pair's checkpoints and pending
writes - and ONLY that pair's. Never implemented via
[CheckpointStore.deleteThread](/api/@graphorin/core/interfaces/CheckpointStore.md#deletethread) (namespace-blind): with a
reused threadId, pruning a terminal thread of workflow A must not
erase the suspended checkpoints of workflow B. Returns the number
of pairs pruned.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`PruneThreadsOptions`](/api/@graphorin/core/interfaces/PruneThreadsOptions.md) |

#### Returns

`Promise`\<`number`\>

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

Defined in: packages/core/src/contracts/checkpoint-store.ts:154

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpoint` | [`Checkpoint`](/api/@graphorin/core/interfaces/Checkpoint.md) |
| `metadata` | [`CheckpointMetadata`](/api/@graphorin/core/interfaces/CheckpointMetadata.md) |
| `opts?` | [`CheckpointPutOptions`](/api/@graphorin/core/interfaces/CheckpointPutOptions.md) |

#### Returns

`Promise`\<`string`\>

#### Inherited from

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

Defined in: packages/core/src/contracts/checkpoint-store.ts:162

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpointId` | `string` |
| `writes` | readonly [`PendingWrite`](/api/@graphorin/core/interfaces/PendingWrite.md)[] |
| `taskId` | `string` |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`CheckpointStore`](/api/@graphorin/core/interfaces/CheckpointStore.md).[`putWrites`](/api/@graphorin/core/interfaces/CheckpointStore.md#putwrites)
