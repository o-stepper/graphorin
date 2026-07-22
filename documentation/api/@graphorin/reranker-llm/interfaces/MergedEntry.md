[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / MergedEntry

# Interface: MergedEntry\&lt;TRecord\&gt;

Defined in: src/reranker.ts:352

**`Stable`**

One merged row returned by [mergeAndDedupe](/api/@graphorin/reranker-llm/functions/mergeAndDedupe.md).

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-firstseenorder"></a> `firstSeenOrder` | `readonly` | `number` | src/reranker.ts:354 |
| <a id="property-hit"></a> `hit` | `readonly` | [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt; | src/reranker.ts:353 |
