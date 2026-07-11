[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RRFReranker

# Class: RRFReranker

Defined in: [packages/memory/src/search/rrf.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/rrf.ts#L30)

Built-in Reciprocal Rank Fusion reranker. Combines multiple ranked
lists (vector hits, FTS5 hits, optional entity boost) into a single
fused ranking by summing `1 / (k + rank)` per list each item appears
in.

Properties (verified by the property-based test suite):

 - **Deterministic.** Identical input lists yield identical output.
 - **Stable under permutation of input lists.** The fusion is
   independent of the order in which the input lists are passed in.
 - **Tie-broken by stable record id.** Records with equal RRF
   scores keep their first-seen order.

## Stable

## Implements

- [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md)

## Constructors

### Constructor

```ts
new RRFReranker(k?): RRFReranker;
```

Defined in: [packages/memory/src/search/rrf.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/rrf.ts#L34)

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `k` | `number` | `RRF_DEFAULT_K` |

#### Returns

`RRFReranker`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `"rrf"` | Stable lowercase identifier surfaced on every span. | [packages/memory/src/search/rrf.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/rrf.ts#L31) |
| <a id="property-k"></a> `k` | `readonly` | `number` | - | [packages/memory/src/search/rrf.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/rrf.ts#L32) |

## Methods

### rerank()

```ts
rerank<TRecord>(
   query, 
   lists, 
options?): Promise<readonly MemoryHit<TRecord>[]>;
```

Defined in: [packages/memory/src/search/rrf.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/rrf.ts#L43)

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
| `options` | [`ReRankOptions`](/api/@graphorin/memory/interfaces/ReRankOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[]\>

#### Implementation of

[`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md).[`rerank`](/api/@graphorin/memory/interfaces/ReRanker.md#rerank)
