[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointStore

# Interface: CheckpointStore

Defined in: [packages/core/src/contracts/checkpoint-store.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L153)

Pluggable checkpoint storage interface. The default implementation
lives in `@graphorin/store-sqlite`.

## Stable

## Extended by

- [`CheckpointStoreExt`](/api/@graphorin/core/interfaces/CheckpointStoreExt.md)

## Methods

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: [packages/core/src/contracts/checkpoint-store.ts:184](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L184)

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

Defined in: [packages/core/src/contracts/checkpoint-store.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L170)

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

***

### list()

```ts
list(
   threadId, 
   namespace, 
opts?): AsyncIterable<CheckpointTuple>;
```

Defined in: [packages/core/src/contracts/checkpoint-store.ts:176](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L176)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/core/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\&lt;[`CheckpointTuple`](/api/@graphorin/core/interfaces/CheckpointTuple.md)\&gt;

***

### listSuspended()?

```ts
optional listSuspended(namespace, opts?): Promise<readonly {
  threadId: string;
  wakeAt: number;
}[]>;
```

Defined in: [packages/core/src/contracts/checkpoint-store.ts:195](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L195)

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

Defined in: [packages/core/src/contracts/checkpoint-store.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L154)

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

Defined in: [packages/core/src/contracts/checkpoint-store.ts:162](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L162)

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
