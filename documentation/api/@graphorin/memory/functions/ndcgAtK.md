[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ndcgAtK

# Function: ndcgAtK()

```ts
function ndcgAtK(
   rankedIds, 
   relevant, 
   k): number;
```

Defined in: [packages/memory/src/search/fit-weights.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/fit-weights.ts#L55)

Binary-gain nDCG@k over a ranked id list.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `rankedIds` | readonly `string`[] |
| `relevant` | `ReadonlySet`\&lt;`string`\&gt; |
| `k` | `number` |

## Returns

`number`

## Stable
