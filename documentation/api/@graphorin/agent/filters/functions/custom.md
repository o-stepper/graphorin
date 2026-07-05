[**Graphorin API reference v0.6.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / custom

# Function: custom()

```ts
function custom(fn, meta?): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:307

Wrap a caller-supplied function as a [DescribedFilter](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) with
the canonical `'custom'` descriptor.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) |
| `meta?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
