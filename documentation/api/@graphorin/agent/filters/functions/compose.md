[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / compose

# Function: compose()

```ts
function compose(...filters): DescribedFilter;
```

Defined in: [packages/agent/src/filters/index.ts:286](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L286)

Compose multiple filters left-to-right. The composer **always**
appends `stripReasoning()` at the end so reasoning content never
crosses a handoff boundary regardless of caller intent.

## Parameters

| Parameter | Type |
| ------ | ------ |
| ...`filters` | readonly [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md)[] |

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
