[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProceduralMemoryStore

# Interface: ProceduralMemoryStore

Defined in: [packages/core/src/contracts/memory-store.ts:204](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L204)

## Stable

## Extended by

- [`ProceduralMemoryStoreExt`](/api/@graphorin/memory/interfaces/ProceduralMemoryStoreExt.md)

## Methods

### add()

```ts
add(rule): Promise<void>;
```

Defined in: [packages/core/src/contracts/memory-store.ts:205](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L205)

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

Defined in: [packages/core/src/contracts/memory-store.ts:206](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L206)

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

Defined in: [packages/core/src/contracts/memory-store.ts:207](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L207)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
