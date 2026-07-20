[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / parseScore

# Function: parseScore()

```ts
function parseScore(text): number | null;
```

Defined in: packages/evals/src/scorers/llm/judge.ts:107

Parse the score from the LAST `SCORE: <n>` (or `SCORE = <n>`) marker in
the reply. Anchoring on a deliberate, trailing marker - rather than the first
integer anywhere - means a number the judge echoes from the candidate, or a
refusal that mentions the `0-10` range, cannot be mistaken for the grade.
Returns `null` when no marker is present (the caller treats that as an error).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

`number` \| `null`
