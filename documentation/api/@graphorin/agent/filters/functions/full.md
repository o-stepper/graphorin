[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / full

# Function: full()

```ts
function full(): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:147

**`Stable`**

The full unfiltered history. Discouraged - security-conscious
callers should pick [lastN](/api/@graphorin/agent/filters/functions/lastN.md) or [bySensitivity](/api/@graphorin/agent/filters/functions/bySensitivity.md) instead
(a sub-agent rarely needs the parent's entire conversation).

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)
