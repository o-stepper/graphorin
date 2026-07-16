[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostBudgets

# Interface: CostBudgets

Defined in: [packages/observability/src/cost/types.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L91)

Budget configuration shape consumed by [createCostTracker](/api/@graphorin/observability/functions/createCostTracker.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-currency"></a> `currency?` | `readonly` | `string` | Currency. Defaults to `'USD'`. | [packages/observability/src/cost/types.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L101) |
| <a id="property-peragent"></a> `perAgent?` | `readonly` | `number` | Per-agent budget. | [packages/observability/src/cost/types.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L97) |
| <a id="property-perrun"></a> `perRun?` | `readonly` | `number` | Per-run budget. | [packages/observability/src/cost/types.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L99) |
| <a id="property-persession"></a> `perSession?` | `readonly` | `number` | Per-session budget in the configured currency. | [packages/observability/src/cost/types.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L93) |
| <a id="property-peruser"></a> `perUser?` | `readonly` | `number` | Per-user budget. | [packages/observability/src/cost/types.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L95) |
