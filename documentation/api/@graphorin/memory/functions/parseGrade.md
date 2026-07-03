[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / parseGrade

# Function: parseGrade()

```ts
function parseGrade(text): RetrievalGrade;
```

Defined in: packages/memory/src/search/iterative.ts:282

Parse a grader model output into a [RetrievalGrade](/api/@graphorin/memory/interfaces/RetrievalGrade.md). Tolerates a
bare JSON object, a fenced block, and chatty text around the object.

**Fail-safe = stop.** When the verdict can't be read (undefined / empty
/ unparseable / missing `sufficient`), returns
`{ sufficient: true, confidence: 0, reformulation: null }` so a broken
grader degrades to a single pass rather than looping or falsely
abstaining. A *parsed* `sufficient: false` (a real insufficiency
verdict) is preserved.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` \| `undefined` |

## Returns

[`RetrievalGrade`](/api/@graphorin/memory/interfaces/RetrievalGrade.md)

## Stable
