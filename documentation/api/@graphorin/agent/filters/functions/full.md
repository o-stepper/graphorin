[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / full

# Function: full()

```ts
function full(): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:147

The full unfiltered history. Emits a deprecation warning per call
— security-conscious callers should pick [lastN](/api/@graphorin/agent/filters/functions/lastN.md) or
[bySensitivity](/api/@graphorin/agent/filters/functions/bySensitivity.md) instead.

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
