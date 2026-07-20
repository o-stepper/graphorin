[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / formatRecallExplanation

# Function: formatRecallExplanation()

```ts
function formatRecallExplanation(explanation): string;
```

Defined in: packages/memory/src/search/explain.ts:108

**`Stable`**

Render a [RecallExplanation](/api/@graphorin/memory/interfaces/RecallExplanation.md) as a compact ASCII block - a
header line plus one line per recalled memory with its signal
breakdown. Pure (returns a string, no I/O); used by operator tooling
and trace inspectors.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `explanation` | [`RecallExplanation`](/api/@graphorin/memory/interfaces/RecallExplanation.md) |

## Returns

`string`
