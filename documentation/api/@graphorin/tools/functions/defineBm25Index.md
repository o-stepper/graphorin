[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / defineBm25Index

# Function: defineBm25Index()

```ts
function defineBm25Index(docs, opts?): (query, k?) => Bm25Match[];
```

Defined in: packages/tools/src/registry/bm25.ts:100

**`Stable`**

Build a BM25 query function over `docs`. The returned function
runs in `O(query tokens × matching docs)` per invocation - bounded
by the registry size.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `docs` | readonly [`Bm25Document`](/api/@graphorin/tools/interfaces/Bm25Document.md)[] |
| `opts` | [`Bm25Options`](/api/@graphorin/tools/interfaces/Bm25Options.md) |

## Returns

(`query`, `k?`) => [`Bm25Match`](/api/@graphorin/tools/interfaces/Bm25Match.md)[]
