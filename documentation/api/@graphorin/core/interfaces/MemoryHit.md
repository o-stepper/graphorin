[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryHit

# Interface: MemoryHit\&lt;TRecord\&gt;

Defined in: packages/core/src/types/memory.ts:422

**`Stable`**

A single retrieval hit with similarity / relevance metadata.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-record"></a> `record` | `readonly` | `TRecord` | - | packages/core/src/types/memory.ts:423 |
| <a id="property-score"></a> `score` | `readonly` | `number` | - | packages/core/src/types/memory.ts:424 |
| <a id="property-signals"></a> `signals?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Optional source signals contributing to `score` (BM25, vec, RRF, …). | packages/core/src/types/memory.ts:426 |
