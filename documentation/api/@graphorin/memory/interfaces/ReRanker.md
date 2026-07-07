[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ReRanker

# Interface: ReRanker

Defined in: [packages/memory/src/search/types.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/types.ts#L17)

Pluggable reranker contract. Concrete implementations live in
`@graphorin/memory/search` (the built-in `RRFReranker`) and the
Phase 16 optional packages (`@graphorin/reranker-transformersjs`,
`@graphorin/reranker-llm`).

The reranker accepts one or more parallel ranked lists (vector +
FTS5 + optional entity boost) and produces a single fused ranking.
Implementations MUST be pure (no I/O outside `signal`-aware
dependencies) so the agent runtime can call them mid-stream without
deadlocking the main loop.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable lowercase identifier surfaced on every span. | [packages/memory/src/search/types.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/types.ts#L19) |

## Methods

### rerank()

```ts
rerank<TRecord>(
   query, 
   lists, 
options?): Promise<readonly MemoryHit<TRecord>[]>;
```

Defined in: [packages/memory/src/search/types.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/types.ts#L25)

Rerank one or more parallel ranked lists and return the fused
top-K (default `topK = 10`). Each input list must already be
sorted by `score` descending.

#### Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[][] |
| `options?` | [`ReRankOptions`](/api/@graphorin/memory/interfaces/ReRankOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[]\>
