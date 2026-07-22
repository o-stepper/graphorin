[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / compose

# Function: compose()

```ts
function compose(...filters): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:286

**`Stable`**

Compose multiple filters left-to-right. The composer **always**
appends `stripReasoning()` at the end so reasoning content never
crosses a handoff boundary regardless of caller intent.

## Parameters

| Parameter | Type |
| ------ | ------ |
| ...`filters` | readonly [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md)[] |

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)
