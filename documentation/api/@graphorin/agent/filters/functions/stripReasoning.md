[**Graphorin API reference v0.6.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / stripReasoning

# Function: stripReasoning()

```ts
function stripReasoning(): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:212

Strip every `ReasoningContent` part from each message. Always
applied at the handoff boundary (the `compose(...)` helper appends
this filter automatically).

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
