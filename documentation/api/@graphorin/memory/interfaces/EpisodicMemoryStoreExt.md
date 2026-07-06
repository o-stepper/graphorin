[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodicMemoryStoreExt

# Interface: EpisodicMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:56

Extension of the typed `EpisodicMemoryStore` with optional
embedding-aware helpers + lifecycle helpers that storage adapters
may expose.

## Stable

## Extends

- [`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md)

## Methods

### archive()?

```ts
optional archive(
   id, 
   reason?, 
scope?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:72

Mark an episode archived. Soft-archive - the row stays for replay.
W-154: with `scope`, adapters no-op unless the row belongs to it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<`void`\>

***

### count()?

```ts
optional count(scope): Promise<number>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:99

Count the recall-eligible episodes for the scope (CE-5) - a `COUNT(*)`,
never materialising rows. Powers honest `metadata()` counts.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<`number`\>

***

### get()

```ts
get(id): Promise<Episode | null>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:129

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<[`Episode`](/api/@graphorin/core/interfaces/Episode.md) \| `null`\>

#### Inherited from

[`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md).[`get`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md#get)

***

### listRecent()?

```ts
optional listRecent(
   scope, 
   limit, 
options?): Promise<readonly Episode[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:79

Most-recent episodes by end time (newest first), with no FTS / vector
query - recency, not relevance (MCON-1). Powers `EpisodicMemory.recent()`
and the deep-phase reflection gate. The default `@graphorin/store-sqlite`
adapter implements it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `limit` | `number` |
| `options?` | \{ `includeQuarantined?`: `boolean`; \} |
| `options.includeQuarantined?` | `boolean` |

#### Returns

`Promise`\<readonly [`Episode`](/api/@graphorin/core/interfaces/Episode.md)[]\>

***

### put()

```ts
put(episode): Promise<void>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:127

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `episode` | [`Episode`](/api/@graphorin/core/interfaces/Episode.md) |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md).[`put`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md#put)

***

### putWithEmbedding()?

```ts
optional putWithEmbedding(episode, options): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:57

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `episode` | [`Episode`](/api/@graphorin/core/interfaces/Episode.md) |
| `options` | [`EmbeddedWriteOptions`](/api/@graphorin/memory/interfaces/EmbeddedWriteOptions.md) |

#### Returns

`Promise`\<`void`\>

***

### search()

```ts
search(scope, opts): Promise<readonly MemoryHit<Episode>[]>;
```

Defined in: packages/core/dist/contracts/memory-store.d.ts:128

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\<[`Episode`](/api/@graphorin/core/interfaces/Episode.md)\>[]\>

#### Inherited from

[`EpisodicMemoryStore`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md).[`search`](/api/@graphorin/core/interfaces/EpisodicMemoryStore.md#search)

***

### searchVector()?

```ts
optional searchVector(
   scope, 
   embedding, 
   embedderId, 
   topK, 
   asOf?, 
includeQuarantined?): Promise<readonly MemoryHit<Episode>[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:58

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - |
| `embedding` | `Float32Array` | - |
| `embedderId` | `string` | - |
| `topK` | `number` | - |
| `asOf?` | `string` | Point-in-time filter (`started_at <= asOf`, ISO-8601). P0-2. |
| `includeQuarantined?` | `boolean` | Include quarantined episodes (validation/inspector path). P1-4. |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\<[`Episode`](/api/@graphorin/core/interfaces/Episode.md)\>[]\>

***

### setStatus()?

```ts
optional setStatus(
   id, 
   status, 
   reason?, 
scope?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:89

Set an episode's retrieval-trust `status` (MCON-2) - promote a quarantined
(auto-formed) episode into default recall or re-quarantine an active one,
with a `memory_history` audit row. Powers [EpisodicMemory.validate](/api/@graphorin/memory/classes/EpisodicMemory.md#validate).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `status` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) |
| `reason?` | `string` |
| `scope?` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<`void`\>
