[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / lastUser

# Function: lastUser()

```ts
function lastUser(): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:115

**`Stable`**

Keep only the parent's system prompt and the most recent user
message. Useful for simple sub-agents that only need the question.

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)
