[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / parseIntegerResponse

# Function: parseIntegerResponse()

```ts
function parseIntegerResponse(text): number | null;
```

Defined in: reranker.ts:288

Parse the model's reply into a non-negative integer. Accepts:

 - `'7'` — bare integer.
 - `'7\n'` / `' 7 '` — surrounding whitespace stripped.
 - `'Score: 7'` / `'7/10'` — first integer in the string is taken.

Returns `null` when no integer can be extracted; the reranker
substitutes the fallback score.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

`number` \| `null`

## Stable
