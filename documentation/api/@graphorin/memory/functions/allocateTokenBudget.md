[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / allocateTokenBudget

# Function: allocateTokenBudget()

```ts
function allocateTokenBudget(
   layers, 
   budgetTokens, 
   counter, 
options?): Promise<AllocationResult>;
```

Defined in: [packages/memory/src/context-engine/token-budget.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L214)

Run the allocator. Layers are sorted by priority ascending (the
first layer is the highest priority); when the running total
exceeds the budget, lower-priority layers are first capped at
their per-layer `cap` (when set) and finally truncated to
whatever fits.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `layers` | readonly [`LayerCandidate`](/api/@graphorin/memory/interfaces/LayerCandidate.md)[] |
| `budgetTokens` | `number` |
| `counter` | [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) |
| `options` | \{ `overflowMode?`: [`OverflowMode`](/api/@graphorin/memory/type-aliases/OverflowMode.md); `priority?`: readonly [`LayerId`](/api/@graphorin/memory/type-aliases/LayerId.md)[]; \} |
| `options.overflowMode?` | [`OverflowMode`](/api/@graphorin/memory/type-aliases/OverflowMode.md) |
| `options.priority?` | readonly [`LayerId`](/api/@graphorin/memory/type-aliases/LayerId.md)[] |

## Returns

`Promise`\&lt;[`AllocationResult`](/api/@graphorin/memory/interfaces/AllocationResult.md)\&gt;

## Stable
