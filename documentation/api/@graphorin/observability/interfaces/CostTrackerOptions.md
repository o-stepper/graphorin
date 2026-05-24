[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostTrackerOptions

# Interface: CostTrackerOptions

Defined in: packages/observability/src/cost/types.ts:100

Configuration shape for [createCostTracker](/api/@graphorin/observability/functions/createCostTracker.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-budgets"></a> `budgets?` | `readonly` | [`CostBudgets`](/api/@graphorin/observability/interfaces/CostBudgets.md) | packages/observability/src/cost/types.ts:101 |
| <a id="property-onexceed"></a> `onExceed?` | `readonly` | [`CostBudgetExceededCallback`](/api/@graphorin/observability/type-aliases/CostBudgetExceededCallback.md) | packages/observability/src/cost/types.ts:102 |
