[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / parseIntegerResponse

# Function: parseIntegerResponse()

```ts
function parseIntegerResponse(text): number | null;
```

Defined in: src/reranker.ts:320

**`Stable`**

Parse the model's reply into a non-negative integer score.

The contract: ONLY a bare integer occupying the whole (trimmed)
reply is accepted (`/^-?\d+$/`) - `'7'`, `'7\n'`, `' 7 '`. Every
verbose form (`'Score: 7'`, `'7/10'`, prose around a number) returns
`null` and the reranker substitutes the fallback score. This is a
deliberate anti-prompt-injection hardening, not a convenience
parser: a passage that steers the model into prose around a chosen
number must not smuggle that number through first-integer
extraction. Negative integers also return `null`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

`number` \| `null`
