[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / observeHistogram

# Function: observeHistogram()

```ts
function observeHistogram(
   name, 
   value, 
   labels?): void;
```

Defined in: packages/tools/src/audit/counters.ts:93

Record an observation in a histogram. Stored as the raw observation
list so consumers can compute their own quantiles; the host
application is responsible for periodic histogram aggregation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | `number` |
| `labels?` | `Readonly`\&lt;`Record`\&lt;`string`, `string` \| `number` \| `boolean`\&gt;\&gt; |

## Returns

`void`

## Stable
