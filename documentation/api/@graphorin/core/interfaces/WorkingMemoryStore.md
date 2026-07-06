[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkingMemoryStore

# Interface: WorkingMemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:75

## Stable

## Methods

### delete()

```ts
delete(
   scope, 
   label, 
reason?): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:79

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\<`void`\>

***

### get()

```ts
get(scope, label): Promise<Block | null>;
```

Defined in: packages/core/src/contracts/memory-store.ts:77

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |

#### Returns

`Promise`\<[`Block`](/api/@graphorin/core/interfaces/Block.md) \| `null`\>

***

### list()

```ts
list(scope): Promise<readonly Block[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:76

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<readonly [`Block`](/api/@graphorin/core/interfaces/Block.md)[]\>

***

### upsert()

```ts
upsert(scope, block): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:78

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `block` | [`Block`](/api/@graphorin/core/interfaces/Block.md) |

#### Returns

`Promise`\<`void`\>
