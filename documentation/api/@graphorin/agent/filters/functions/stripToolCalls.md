[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / stripToolCalls

# Function: stripToolCalls()

```ts
function stripToolCalls(): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:260

**`Stable`**

Drop every assistant `toolCalls` array AND every `tool` message.
Useful when a sub-agent should only see the textual conversation.

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)
