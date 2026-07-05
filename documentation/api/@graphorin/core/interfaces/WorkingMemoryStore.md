[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkingMemoryStore

# Interface: WorkingMemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:39

## Stable

## Methods

### delete()

```ts
delete(
   scope, 
   label, 
reason?): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:43

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(scope, label): Promise<Block | null>;
```

Defined in: packages/core/src/contracts/memory-store.ts:41

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |

#### Returns

`Promise`\&lt;[`Block`](/api/@graphorin/core/interfaces/Block.md) \| `null`\&gt;

***

### list()

```ts
list(scope): Promise<readonly Block[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:40

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`Block`](/api/@graphorin/core/interfaces/Block.md)[]\&gt;

***

### upsert()

```ts
upsert(scope, block): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:42

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `block` | [`Block`](/api/@graphorin/core/interfaces/Block.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
