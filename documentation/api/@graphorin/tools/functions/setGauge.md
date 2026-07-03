[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / setGauge

# Function: setGauge()

```ts
function setGauge(
   name, 
   value, 
   labels?): void;
```

Defined in: packages/tools/src/audit/counters.ts:66

Set a gauge value. Used for one-shot signals like the
`tool.result.truncation.first-overrun{toolName}` per-tool flag.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | `number` |
| `labels?` | `Readonly`\<`Record`\&lt;`string`, `string` \| `number` \| `boolean`\&gt;\> |

## Returns

`void`

## Stable
