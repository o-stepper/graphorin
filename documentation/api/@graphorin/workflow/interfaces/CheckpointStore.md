[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / CheckpointStore

# Interface: CheckpointStore

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:127

Pluggable checkpoint storage interface. The default implementation
lives in `@graphorin/store-sqlite`.

## Stable

## Methods

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:138

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

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:130

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

***

### list()

```ts
list(
   threadId, 
   namespace, 
opts?): AsyncIterable<CheckpointTuple>;
```

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:131

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/workflow/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\&lt;[`CheckpointTuple`](/api/@graphorin/workflow/interfaces/CheckpointTuple.md)\&gt;

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

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:128

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

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:129

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
