[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryInspectResult

# Interface: MemoryInspectResult

Defined in: packages/cli/src/commands/memory.ts:247

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-chain"></a> `chain` | `readonly` | readonly [`MemoryInspectFact`](/api/@graphorin/cli/interfaces/MemoryInspectFact.md)[] | - | packages/cli/src/commands/memory.ts:250 |
| <a id="property-citinginsights"></a> `citingInsights` | `readonly` | readonly [`MemoryCitingInsight`](/api/@graphorin/cli/interfaces/MemoryCitingInsight.md)[] | - | packages/cli/src/commands/memory.ts:253 |
| <a id="property-conflicts"></a> `conflicts` | `readonly` | readonly [`MemoryConflictEntry`](/api/@graphorin/cli/interfaces/MemoryConflictEntry.md)[] | - | packages/cli/src/commands/memory.ts:252 |
| <a id="property-fact"></a> `fact` | `readonly` | \| [`MemoryInspectFact`](/api/@graphorin/cli/interfaces/MemoryInspectFact.md) \| `null` | - | packages/cli/src/commands/memory.ts:249 |
| <a id="property-found"></a> `found` | `readonly` | `boolean` | - | packages/cli/src/commands/memory.ts:248 |
| <a id="property-history"></a> `history` | `readonly` | readonly [`MemoryHistoryEntry`](/api/@graphorin/cli/interfaces/MemoryHistoryEntry.md)[] | - | packages/cli/src/commands/memory.ts:251 |
| <a id="property-linkedentities"></a> `linkedEntities` | `readonly` | readonly [`MemoryInspectEntity`](/api/@graphorin/cli/interfaces/MemoryInspectEntity.md)[] | Canonical entities this fact links to (P2-1 / migration 016). | packages/cli/src/commands/memory.ts:255 |
