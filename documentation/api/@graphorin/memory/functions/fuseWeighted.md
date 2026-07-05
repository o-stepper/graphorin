[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / fuseWeighted

# Function: fuseWeighted()

```ts
function fuseWeighted<TRecord>(
   lists, 
   weights, 
   k, 
   labels?): readonly MemoryHit<TRecord>[];
```

Defined in: packages/memory/src/search/rrf.ts:148

Weighted / convex generalization of [fuseRrf](/api/@graphorin/memory/functions/fuseRrf.md) (X-2). Each input
list `i` contributes `weights[i] · 1 / (k + rank)` to a record's fused
score instead of the flat `1 / (k + rank)`, so a caller who has
calibrated list reliability against labels (the P0-1 eval harness) can
trust one retriever over another. RRF stays the zero-tuning default: a
`weights` of `undefined` (or all-`1`) is byte-for-byte identical to
[fuseRrf](/api/@graphorin/memory/functions/fuseRrf.md). A missing, non-finite, or negative entry falls back to
the neutral weight `1`, so a partial / malformed `weights` never throws
or poisons the ranking.

Like [fuseRrf](/api/@graphorin/memory/functions/fuseRrf.md) the fusion is deterministic, tie-broken by
first-seen order, and preserves any upstream `signals` (FTS `bm25`,
vector similarity) the hits carried in - the `rrf` / `rrf.list_N`
signals it records are the *weighted* contributions, so the fused
`score` still equals their sum. Note that - unlike RRF - the result
depends on input list *order*, because each weight is bound to a list
position.

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[][] |
| `weights` | readonly `number`[] \| `undefined` |
| `k` | `number` |
| `labels?` | readonly `string`[] |

## Returns

readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[]

## Stable
