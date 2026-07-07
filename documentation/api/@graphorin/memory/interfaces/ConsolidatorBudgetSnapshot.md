[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorBudgetSnapshot

# Interface: ConsolidatorBudgetSnapshot

Defined in: [packages/memory/src/consolidator/types.ts:271](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L271)

Budget snapshot block of [ConsolidatorStatus](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md). Surfaces
both the absolute usage and the remaining envelope so consumers
(CLI, server health endpoint) can render the operator dashboard
without doing the math themselves.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-costremaining"></a> `costRemaining` | `readonly` | `number` | [packages/memory/src/consolidator/types.ts:275](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L275) |
| <a id="property-costusedtoday"></a> `costUsedToday` | `readonly` | `number` | [packages/memory/src/consolidator/types.ts:273](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L273) |
| <a id="property-resetat"></a> `resetAt` | `readonly` | `string` | [packages/memory/src/consolidator/types.ts:276](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L276) |
| <a id="property-tokensremaining"></a> `tokensRemaining` | `readonly` | `number` | [packages/memory/src/consolidator/types.ts:274](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L274) |
| <a id="property-tokensusedtoday"></a> `tokensUsedToday` | `readonly` | `number` | [packages/memory/src/consolidator/types.ts:272](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L272) |
