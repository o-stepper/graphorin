[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createConsolidatorPlaceholder

# Function: createConsolidatorPlaceholder()

```ts
function createConsolidatorPlaceholder(options?): Consolidator;
```

Defined in: packages/memory/src/consolidator/index.ts:187

**`Stable`**

Build a no-op consolidator that honours the full [Consolidator](/api/@graphorin/memory/interfaces/Consolidator.md)
interface but performs no background work. Useful for consumers
that want the typed shape (e.g., unit tests of higher tiers) but
do not pay the runtime cost of triggers / locking / DLQ.

Phase 10c's [createConsolidator](/api/@graphorin/memory/functions/createConsolidator.md) is the production factory.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `tier?`: [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md); `triggers?`: readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[]; \} |
| `options.tier?` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) |
| `options.triggers?` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] |

## Returns

[`Consolidator`](/api/@graphorin/memory/interfaces/Consolidator.md)
