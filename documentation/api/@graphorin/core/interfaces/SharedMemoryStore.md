[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SharedMemoryStore

# Interface: SharedMemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:148

## Stable

## Methods

### attach()

```ts
attach(recordId, agentId): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:149

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `recordId` | `string` |
| `agentId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### detach()

```ts
detach(recordId, agentId): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:150

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `recordId` | `string` |
| `agentId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### listFor()

```ts
listFor(agentId): Promise<readonly MemoryRecord[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:151

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |

#### Returns

`Promise`\&lt;readonly [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)[]\&gt;
