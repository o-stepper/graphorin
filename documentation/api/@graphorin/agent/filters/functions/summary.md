[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / summary

# Function: summary()

```ts
function summary(text): DescribedFilter;
```

Defined in: [packages/agent/src/filters/index.ts:158](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L158)

Replace the parent's history with a single system message carrying
the supplied summary. Used by callers that wire in an LLM-based
summarizer outside the framework.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
