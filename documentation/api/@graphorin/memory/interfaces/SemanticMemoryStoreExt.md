[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SemanticMemoryStoreExt

# Interface: SemanticMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:62

Extension of the typed `SemanticMemoryStore` with optional
embedding-aware helpers + lifecycle helpers that storage adapters
may expose.

## Stable

## Extends

- [`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md)

## Methods

### forget()

```ts
forget(id, reason?): Promise<void>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:72

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md).[`forget`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#forget)

***

### get()?

```ts
optional get(id): Promise<Fact | null>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:71

Lookup a single fact by id (returns `null` when absent or soft-deleted).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md) \| `null`\&gt;

***

### purge()?

```ts
optional purge(id, reason?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:77

Hard-delete a fact (GDPR path). The audit log row is preserved
but the row itself + every per-embedder vec0 entry is removed.
Distinct from [SemanticMemoryStore.forget](/api/@graphorin/memory/interfaces/SemanticMemoryStoreExt.md#forget) (soft-delete).

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

Defined in: packages/core/dist/contracts/memory-store.d.ts:69

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md).[`remember`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#remember)

***

### rememberWithEmbedding()?

```ts
optional rememberWithEmbedding(fact, options): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:63

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |
| `options` | [`EmbeddedWriteOptions`](/api/@graphorin/memory/interfaces/EmbeddedWriteOptions.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### search()

```ts
search(scope, opts): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:70

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[]\>

#### Inherited from

[`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md).[`search`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#search)

***

### searchVector()?

```ts
optional searchVector(
   scope, 
   embedding, 
   embedderId, 
topK): Promise<readonly MemoryHit<Fact>[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:64

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `embedding` | `Float32Array` |
| `embedderId` | `string` |
| `topK` | `number` |

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

Defined in: packages/core/dist/contracts/memory-store.d.ts:71

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `oldId` | `string` |
| `newFact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`SemanticMemoryStore`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md).[`supersede`](/api/@graphorin/core/interfaces/SemanticMemoryStore.md#supersede)
