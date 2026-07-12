[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SharedMemoryStore

# Interface: SharedMemoryStore

Defined in: [packages/core/src/contracts/memory-store.ts:211](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L211)

## Stable

## Methods

### attach()

```ts
attach(recordId, agentId): Promise<void>;
```

Defined in: [packages/core/src/contracts/memory-store.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L212)

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

Defined in: [packages/core/src/contracts/memory-store.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L213)

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

Defined in: [packages/core/src/contracts/memory-store.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L214)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |

#### Returns

`Promise`\&lt;readonly [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)[]\&gt;
