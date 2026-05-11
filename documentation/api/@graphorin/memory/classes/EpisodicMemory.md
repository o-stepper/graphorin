[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodicMemory

# Class: EpisodicMemory

Defined in: packages/memory/src/tiers/episodic-memory.ts:69

`EpisodicMemory` — record + retrieve summarized stretches of past
activity. Stored embeddings power triple-signal retrieval (recency
× relevance × importance).

## Stable

## Constructors

### Constructor

```ts
new EpisodicMemory(args): EpisodicMemory;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:75

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `embedder`: \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null`; `embedderIdProvider`: () => `string` \| `null`; `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.embedder` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` |
| `args.embedderIdProvider` | () => `string` \| `null` |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`EpisodicMemory`

## Methods

### archive()

```ts
archive(
   scope, 
   episodeId, 
reason?): Promise<void>;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:184

Soft-archive an episode. Storage adapters that implement
`EpisodicMemoryStoreExt.archive(...)` mark the row archived in
place. Adapters that do not expose the extension surface a
friendly `TypeError` so the operator can opt the storage layer
in (or call `episodic.put(...)` with the archived state set
manually).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `episodeId` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(id): Promise<Episode | null>;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:134

Lookup a single episode by id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md) \| `null`\&gt;

***

### recent()

```ts
recent(scope, opts?): Promise<readonly Episode[]>;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:203

List the most recent episodes (no embedding required).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | \{ `topK?`: `number`; \} |
| `opts.topK?` | `number` |

#### Returns

`Promise`\&lt;readonly [`Episode`](/api/@graphorin/core/interfaces/Episode.md)[]\&gt;

***

### record()

```ts
record(scope, input): Promise<Episode>;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:88

Persist an episode + its embedding (when an embedder is configured).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input` | [`EpisodeInput`](/api/@graphorin/memory/interfaces/EpisodeInput.md) |

#### Returns

`Promise`\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md)\&gt;

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<Episode>[]>;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:145

Triple-signal episode retrieval (`recency × relevance ×
importance`). The vector signal is computed on demand when an
embedder is configured AND the storage adapter exposes
`searchVector`; otherwise the FTS5 BM25 score is fed into the
relevance term as a normalized fallback.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts` | [`EpisodeSearchOptions`](/api/@graphorin/memory/interfaces/EpisodeSearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md)\&gt;[]\>
