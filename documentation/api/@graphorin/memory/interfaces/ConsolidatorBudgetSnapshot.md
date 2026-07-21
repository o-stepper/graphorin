[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorBudgetSnapshot

# Interface: ConsolidatorBudgetSnapshot

Defined in: packages/memory/src/consolidator/types.ts:339

**`Stable`**

Budget snapshot block of [ConsolidatorStatus](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md). Surfaces
both the absolute usage and the remaining envelope so consumers
(CLI, server health endpoint) can render the operator dashboard
without doing the math themselves.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-costremaining"></a> `costRemaining` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:343 |
| <a id="property-costusedtoday"></a> `costUsedToday` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:341 |
| <a id="property-resetat"></a> `resetAt` | `readonly` | `string` | packages/memory/src/consolidator/types.ts:344 |
| <a id="property-tokensremaining"></a> `tokensRemaining` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:342 |
| <a id="property-tokensusedtoday"></a> `tokensUsedToday` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:340 |
