[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / MergedEntry

# Interface: MergedEntry\&lt;TRecord\&gt;

Defined in: packages/reranker-transformersjs/src/reranker.ts:292

**`Stable`**

One merged row returned by [mergeAndDedupe](/api/@graphorin/reranker-transformersjs/functions/mergeAndDedupe.md).

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-firstseenorder"></a> `firstSeenOrder` | `readonly` | `number` | packages/reranker-transformersjs/src/reranker.ts:294 |
| <a id="property-hit"></a> `hit` | `readonly` | [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt; | packages/reranker-transformersjs/src/reranker.ts:293 |
