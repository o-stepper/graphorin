[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostBudgetExceededCallback

# Type Alias: CostBudgetExceededCallback

```ts
type CostBudgetExceededCallback = (event) => void;
```

Defined in: packages/observability/src/cost/types.ts:111

**`Stable`**

Callback invoked when an aggregation scope crosses its configured
budget. The handler receives a sanitized payload - the secret-free
scope id + the breached numbers.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | \{ `actual`: `number`; `budget`: `number`; `currency`: `string`; `id`: `string`; `scope`: [`CostScope`](/api/@graphorin/observability/type-aliases/CostScope.md); \} |
| `event.actual` | `number` |
| `event.budget` | `number` |
| `event.currency` | `string` |
| `event.id` | `string` |
| `event.scope` | [`CostScope`](/api/@graphorin/observability/type-aliases/CostScope.md) |

## Returns

`void`
