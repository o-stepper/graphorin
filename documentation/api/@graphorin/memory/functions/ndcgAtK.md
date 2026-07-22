[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ndcgAtK

# Function: ndcgAtK()

```ts
function ndcgAtK(
   rankedIds, 
   relevant, 
   k): number;
```

Defined in: packages/memory/src/search/fit-weights.ts:55

**`Stable`**

Binary-gain nDCG@k over a ranked id list.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `rankedIds` | readonly `string`[] |
| `relevant` | `ReadonlySet`\&lt;`string`\&gt; |
| `k` | `number` |

## Returns

`number`
