[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointStore

# Interface: CheckpointStore

Defined in: packages/core/src/contracts/checkpoint-store.ts:86

Pluggable checkpoint storage interface. The default implementation
lives in `@graphorin/store-sqlite`.

## Stable

## Methods

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: packages/core/src/contracts/checkpoint-store.ts:110

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

Defined in: packages/core/src/contracts/checkpoint-store.ts:102

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

Defined in: packages/core/src/contracts/checkpoint-store.ts:108

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `opts?` | [`ListOptions`](/api/@graphorin/core/interfaces/ListOptions.md) |

#### Returns

`AsyncIterable`\&lt;[`CheckpointTuple`](/api/@graphorin/core/interfaces/CheckpointTuple.md)\&gt;

***

### put()

```ts
put(
   threadId, 
   namespace, 
   checkpoint, 
metadata): Promise<string>;
```

Defined in: packages/core/src/contracts/checkpoint-store.ts:87

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `namespace` | `string` |
| `checkpoint` | [`Checkpoint`](/api/@graphorin/core/interfaces/Checkpoint.md) |
| `metadata` | [`CheckpointMetadata`](/api/@graphorin/core/interfaces/CheckpointMetadata.md) |

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

Defined in: packages/core/src/contracts/checkpoint-store.ts:94

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
