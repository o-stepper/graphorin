[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / defineBlock

# Function: defineBlock()

```ts
function defineBlock(spec): BlockDefinition;
```

Defined in: packages/memory/src/tiers/working-memory.ts:64

**`Stable`**

Build a frozen [BlockDefinition](/api/@graphorin/memory/interfaces/BlockDefinition.md). Surfaced as `blocks.define(...)`
for ergonomic call-sites; the underlying object is the same shape
the [WorkingMemory.define](/api/@graphorin/memory/classes/WorkingMemory.md#define) method accepts.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`BlockSpec`](/api/@graphorin/memory/interfaces/BlockSpec.md) |

## Returns

[`BlockDefinition`](/api/@graphorin/memory/interfaces/BlockDefinition.md)
