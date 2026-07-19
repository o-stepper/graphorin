[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / defaultHandoffFilter

# Function: defaultHandoffFilter()

```ts
function defaultHandoffFilter(): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:326

**`Stable`**

The canonical default applied by the agent runtime to every
`Agent.toTool(...)` and `handoff(...)` invocation when the caller
does not supply an explicit filter.

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)
