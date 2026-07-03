[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / lastN

# Function: lastN()

```ts
function lastN(n?): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:89

Keep the parent's system prompt and the last `n` non-system
messages. Default `n = 10` per DEC-146 / RB-40 security-first
compose.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `n` | `number` | `10` |

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
