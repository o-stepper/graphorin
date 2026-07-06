[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / WeightedRRFReranker

# Class: WeightedRRFReranker

Defined in: packages/memory/src/search/rrf.ts:73

Weighted-RRF reranker (X-2). Fuses parallel ranked lists through
[fuseWeighted](/api/@graphorin/memory/functions/fuseWeighted.md), applying a per-list `weights[i]` so a caller who
has calibrated list reliability against labels (the P0-1 eval harness)
can trust one retriever over another - e.g. up-weight dense vector
hits over lexical FTS hits. `weights` is **positional**: aligned to the
input `lists` order (the built-in hybrid search passes FTS first, then
vector). At equal weights it is identical to [RRFReranker](/api/@graphorin/memory/classes/RRFReranker.md); RRF
stays the framework default.

Like the RRF reranker it is deterministic and tie-broken by stable
record id, and it preserves the upstream `signals` on each hit.

## Stable

## Implements

- [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md)

## Constructors

### Constructor

```ts
new WeightedRRFReranker(args): WeightedRRFReranker;
```

Defined in: packages/memory/src/search/rrf.ts:78

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `k?`: `number`; `weights`: readonly `number`[]; \} |
| `args.k?` | `number` |
| `args.weights` | readonly `number`[] |

#### Returns

`WeightedRRFReranker`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `"weighted-rrf"` | Stable lowercase identifier surfaced on every span. | packages/memory/src/search/rrf.ts:74 |
| <a id="property-k"></a> `k` | `readonly` | `number` | - | packages/memory/src/search/rrf.ts:75 |
| <a id="property-weights"></a> `weights` | `readonly` | readonly `number`[] | - | packages/memory/src/search/rrf.ts:76 |

## Methods

### rerank()

```ts
rerank<TRecord>(
   query, 
   lists, 
options?): Promise<readonly MemoryHit<TRecord>[]>;
```

Defined in: packages/memory/src/search/rrf.ts:96

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
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\<`TRecord`\>[][] |
| `options` | [`ReRankOptions`](/api/@graphorin/memory/interfaces/ReRankOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\<`TRecord`\>[]\>

#### Implementation of

[`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md).[`rerank`](/api/@graphorin/memory/interfaces/ReRanker.md#rerank)
