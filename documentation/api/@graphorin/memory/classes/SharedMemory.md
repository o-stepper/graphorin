[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SharedMemory

# Class: SharedMemory

Defined in: packages/memory/src/tiers/shared-memory.ts:13

`SharedMemory` — many-to-many attach mode for blocks / facts /
rules across multiple agents. Storage adapters represent
attachments as a join table (`shared_attachments` in
`@graphorin/store-sqlite`).

## Stable

## Constructors

### Constructor

```ts
new SharedMemory(args): SharedMemory;
```

Defined in: packages/memory/src/tiers/shared-memory.ts:17

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`SharedMemory`

## Methods

### attach()

```ts
attach(
   recordId, 
   agentId, 
userId): Promise<void>;
```

Defined in: packages/memory/src/tiers/shared-memory.ts:23

Attach `recordId` to `agentId`. Idempotent.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `recordId` | `string` |
| `agentId` | `string` |
| `userId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### detach()

```ts
detach(
   recordId, 
   agentId, 
userId): Promise<void>;
```

Defined in: packages/memory/src/tiers/shared-memory.ts:36

Detach `recordId` from `agentId`. Idempotent.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `recordId` | `string` |
| `agentId` | `string` |
| `userId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### listFor()

```ts
listFor(agentId, userId): Promise<readonly MemoryRecord[]>;
```

Defined in: packages/memory/src/tiers/shared-memory.ts:49

List every attachment for `agentId`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |
| `userId` | `string` |

#### Returns

`Promise`\&lt;readonly [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)[]\&gt;
