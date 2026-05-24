[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodicMemoryStoreExt

# Interface: EpisodicMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:43

Extension of the typed `EpisodicMemoryStore` with optional
embedding-aware helpers + lifecycle helpers that storage adapters
may expose.

## Stable

## Extends

- [`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md)

## Methods

### archive()?

```ts
optional archive(id, reason?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:52

Mark an episode archived. Soft-archive — the row stays for replay.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(id): Promise<Episode | null>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:65

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md) \| `null`\&gt;

#### Inherited from

[`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md).[`get`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md#get)

***

### put()

```ts
put(episode): Promise<void>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:63

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `episode` | [`Episode`](/api/@graphorin/core/interfaces/Episode.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md).[`put`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md#put)

***

### putWithEmbedding()?

```ts
optional putWithEmbedding(episode, options): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:44

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `episode` | [`Episode`](/api/@graphorin/core/interfaces/Episode.md) |
| `options` | [`EmbeddedWriteOptions`](/api/@graphorin/memory/interfaces/EmbeddedWriteOptions.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### search()

```ts
search(scope, opts): Promise<readonly MemoryHit<Episode>[]>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:64

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md)\&gt;[]\>

#### Inherited from

[`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md).[`search`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md#search)

***

### searchVector()?

```ts
optional searchVector(
   scope, 
   embedding, 
   embedderId, 
topK): Promise<readonly MemoryHit<Episode>[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:45

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `embedding` | `Float32Array` |
| `embedderId` | `string` |
| `topK` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md)\&gt;[]\>
