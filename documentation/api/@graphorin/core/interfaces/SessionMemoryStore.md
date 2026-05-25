[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionMemoryStore

# Interface: SessionMemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:59

## Stable

## Extended by

- [`SessionMemoryStoreExt`](/api/@graphorin/memory/interfaces/SessionMemoryStoreExt.md)

## Methods

### list()

```ts
list(scope, opts?): Promise<readonly Message[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:61

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]\&gt;

***

### push()

```ts
push(scope, message): Promise<MessageRef>;
```

Defined in: packages/core/src/contracts/memory-store.ts:60

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |

#### Returns

`Promise`\&lt;[`MessageRef`](/api/@graphorin/core/interfaces/MessageRef.md)\&gt;

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<MemoryRecord>[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:62

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts?` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)\&gt;[]\>
