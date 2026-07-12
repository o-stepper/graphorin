[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProceduralMemoryStore

# Interface: ProceduralMemoryStore

Defined in: [packages/core/src/contracts/memory-store.ts:195](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L195)

## Stable

## Extended by

- [`ProceduralMemoryStoreExt`](/api/@graphorin/memory/interfaces/ProceduralMemoryStoreExt.md)

## Methods

### add()

```ts
add(rule): Promise<void>;
```

Defined in: [packages/core/src/contracts/memory-store.ts:196](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L196)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rule` | [`Rule`](/api/@graphorin/core/interfaces/Rule.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### list()

```ts
list(scope): Promise<readonly Rule[]>;
```

Defined in: [packages/core/src/contracts/memory-store.ts:197](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L197)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`Rule`](/api/@graphorin/core/interfaces/Rule.md)[]\&gt;

***

### remove()

```ts
remove(id, reason?): Promise<void>;
```

Defined in: [packages/core/src/contracts/memory-store.ts:198](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L198)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
