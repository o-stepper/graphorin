[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / capInsightsBelowFacts

# Function: capInsightsBelowFacts()

```ts
function capInsightsBelowFacts(factHits, insightHits): readonly MemoryHit<Insight>[];
```

Defined in: packages/memory/src/tiers/insight-memory.ts:182

**`Stable`**

Enforce the rank ceiling: an insight may never outrank a primary
fact **it cites**. For each insight hit, if any fact it cites is
present in `factHits`, its score is lowered to strictly below that
cited fact's score - so concatenating the two lists and sorting by
score descending can never place the insight above the evidence it
was synthesized from. Insights whose cited facts are absent from
`factHits` are returned unchanged; this is a relative, not a global,
cap ("never outrank the primary facts they cite").

Pure + deterministic - does not mutate its inputs.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `factHits` | readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[] |
| `insightHits` | readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Insight`](/api/@graphorin/core/interfaces/Insight.md)\&gt;[] |

## Returns

readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Insight`](/api/@graphorin/core/interfaces/Insight.md)\&gt;[]
