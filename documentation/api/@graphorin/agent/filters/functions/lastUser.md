[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / lastUser

# Function: lastUser()

```ts
function lastUser(): DescribedFilter;
```

Defined in: [packages/agent/src/filters/index.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L115)

Keep only the parent's system prompt and the most recent user
message. Useful for simple sub-agents that only need the question.

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
