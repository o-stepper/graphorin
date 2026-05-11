[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AllocationResult

# Interface: AllocationResult

Defined in: packages/memory/src/context-engine/token-budget.ts:94

Result of an allocator run.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-budgettokens"></a> `budgetTokens` | `readonly` | `number` | packages/memory/src/context-engine/token-budget.ts:97 |
| <a id="property-layers"></a> `layers` | `readonly` | readonly [`LayerAllocation`](/api/@graphorin/memory/interfaces/LayerAllocation.md)[] | packages/memory/src/context-engine/token-budget.ts:95 |
| <a id="property-overflowdropped"></a> `overflowDropped` | `readonly` | readonly [`LayerId`](/api/@graphorin/memory/type-aliases/LayerId.md)[] | packages/memory/src/context-engine/token-budget.ts:98 |
| <a id="property-totaltokens"></a> `totalTokens` | `readonly` | `number` | packages/memory/src/context-engine/token-budget.ts:96 |
