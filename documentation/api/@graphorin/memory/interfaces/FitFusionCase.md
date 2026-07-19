[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FitFusionCase

# Interface: FitFusionCase\&lt;TRecord\&gt;

Defined in: packages/memory/src/search/fit-weights.ts:22

One labelled query: per-kind candidate lists + the relevant ids.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fts"></a> `fts` | `readonly` | readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[] | FTS candidate list, best-first (as the store returns it). | packages/memory/src/search/fit-weights.ts:24 |
| <a id="property-relevantids"></a> `relevantIds` | `readonly` | readonly `string`[] | Ids judged relevant for this query (binary gain). | packages/memory/src/search/fit-weights.ts:28 |
| <a id="property-vector"></a> `vector` | `readonly` | readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[] | Vector candidate list, best-first. | packages/memory/src/search/fit-weights.ts:26 |
