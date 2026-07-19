[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / CheckpointStore

# Interface: CheckpointStore

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

**`Stable`**

Pluggable checkpoint storage interface. The default implementation
lives in `@graphorin/store-sqlite`.

## Methods

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

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

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

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

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/workflow/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\&lt;[`CheckpointTuple`](/api/@graphorin/workflow/interfaces/CheckpointTuple.md)\&gt;

***

### listSuspended()?

```ts
optional listSuspended(namespace, opts?): Promise<readonly {
  threadId: string;
  wakeAt: number;
}[]>;
```

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

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

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

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

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

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
