[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SemanticMemoryStore

# Interface: SemanticMemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:110

## Stable

## Extended by

- [`SemanticMemoryStoreExt`](/api/@graphorin/memory/interfaces/SemanticMemoryStoreExt.md)

## Methods

### forget()

```ts
forget(id, reason?): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:114

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### remember()

```ts
remember(fact): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:111

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### search()

```ts
search(scope, opts): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:112

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[]\>

***

### supersede()

```ts
supersede(
   oldId, 
   newFact, 
reason?): Promise<void>;
```

Defined in: packages/core/src/contracts/memory-store.ts:113

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `oldId` | `string` |
| `newFact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
