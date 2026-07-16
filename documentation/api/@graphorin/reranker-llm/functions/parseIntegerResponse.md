[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / parseIntegerResponse

# Function: parseIntegerResponse()

```ts
function parseIntegerResponse(text): number | null;
```

Defined in: [packages/reranker-llm/src/reranker.ts:315](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L315)

Parse the model's reply into a non-negative integer score.

PS-14 contract: ONLY a bare integer occupying the whole (trimmed)
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

## Stable
