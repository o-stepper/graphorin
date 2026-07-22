[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodicMemory

# Class: EpisodicMemory

Defined in: packages/memory/src/tiers/episodic-memory.ts:107

**`Stable`**

`EpisodicMemory` - record + retrieve summarized stretches of past
activity. Stored embeddings power triple-signal retrieval (recency
× relevance × importance).

## Constructors

### Constructor

```ts
new EpisodicMemory(args): EpisodicMemory;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:113

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

Defined in: packages/memory/src/tiers/episodic-memory.ts:253

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

Defined in: packages/memory/src/tiers/episodic-memory.ts:176

Lookup a single episode by id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`Episode`](/api/@graphorin/core/interfaces/Episode.md) \| `null`\&gt;

***

### listRecent()

```ts
listRecent(
   scope, 
   limit, 
opts?): Promise<readonly Episode[]>;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:277

Most-recent episodes by end time (newest first), with no embedding / FTS
query. Requires `EpisodicMemoryStoreExt.listRecent` - the default
`@graphorin/store-sqlite` adapter implements it. Optionally includes
quarantined episodes (the importance source for the reflection gate).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `limit` | `number` |
| `opts` | \{ `includeQuarantined?`: `boolean`; \} |
| `opts.includeQuarantined?` | `boolean` |

#### Returns

`Promise`\&lt;readonly [`Episode`](/api/@graphorin/core/interfaces/Episode.md)[]\&gt;

***

### recent()

```ts
recent(scope, opts?): Promise<readonly Episode[]>;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:297

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

Defined in: packages/memory/src/tiers/episodic-memory.ts:126

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

Defined in: packages/memory/src/tiers/episodic-memory.ts:187

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

***

### validate()

```ts
validate(
   scope, 
   episodeId, 
   reason?, 
options?): Promise<void>;
```

Defined in: packages/memory/src/tiers/episodic-memory.ts:308

Promote a quarantined episode into default recall. Mirrors
[SemanticMemory.validate](/api/@graphorin/memory/classes/SemanticMemory.md#validate): re-derives the injection verdict from the
stored summary and **refuses** promotion of an injection-flagged episode
(`QuarantinePromotionRefusedError`) unless an operator passes
`{ force: true }` from a trusted, non-agent context.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `episodeId` | `string` |
| `reason?` | `string` |
| `options?` | \{ `force?`: `boolean`; \} |
| `options.force?` | `boolean` |

#### Returns

`Promise`\&lt;`void`\&gt;
