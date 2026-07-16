[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AllocationResult

# Interface: AllocationResult

Defined in: [packages/memory/src/context-engine/token-budget.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L100)

Result of an allocator run.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-budgettokens"></a> `budgetTokens` | `readonly` | `number` | [packages/memory/src/context-engine/token-budget.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L103) |
| <a id="property-layers"></a> `layers` | `readonly` | readonly [`LayerAllocation`](/api/@graphorin/memory/interfaces/LayerAllocation.md)[] | [packages/memory/src/context-engine/token-budget.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L101) |
| <a id="property-overflowdropped"></a> `overflowDropped` | `readonly` | readonly [`LayerId`](/api/@graphorin/memory/type-aliases/LayerId.md)[] | [packages/memory/src/context-engine/token-budget.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L104) |
| <a id="property-totaltokens"></a> `totalTokens` | `readonly` | `number` | [packages/memory/src/context-engine/token-budget.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L102) |
