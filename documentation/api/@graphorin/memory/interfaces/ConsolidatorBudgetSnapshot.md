[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorBudgetSnapshot

# Interface: ConsolidatorBudgetSnapshot

Defined in: packages/memory/src/consolidator/types.ts:271

Budget snapshot block of [ConsolidatorStatus](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md). Surfaces
both the absolute usage and the remaining envelope so consumers
(CLI, server health endpoint) can render the operator dashboard
without doing the math themselves.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-costremaining"></a> `costRemaining` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:275 |
| <a id="property-costusedtoday"></a> `costUsedToday` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:273 |
| <a id="property-resetat"></a> `resetAt` | `readonly` | `string` | packages/memory/src/consolidator/types.ts:276 |
| <a id="property-tokensremaining"></a> `tokensRemaining` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:274 |
| <a id="property-tokensusedtoday"></a> `tokensUsedToday` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:272 |
