[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryInspectResult

# Interface: MemoryInspectResult

Defined in: [packages/cli/src/commands/memory.ts:365](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L365)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-chain"></a> `chain` | `readonly` | readonly [`MemoryInspectFact`](/api/@graphorin/cli/interfaces/MemoryInspectFact.md)[] | - | [packages/cli/src/commands/memory.ts:368](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L368) |
| <a id="property-citinginsights"></a> `citingInsights` | `readonly` | readonly [`MemoryCitingInsight`](/api/@graphorin/cli/interfaces/MemoryCitingInsight.md)[] | - | [packages/cli/src/commands/memory.ts:371](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L371) |
| <a id="property-conflicts"></a> `conflicts` | `readonly` | readonly [`MemoryConflictEntry`](/api/@graphorin/cli/interfaces/MemoryConflictEntry.md)[] | - | [packages/cli/src/commands/memory.ts:370](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L370) |
| <a id="property-fact"></a> `fact` | `readonly` | \| [`MemoryInspectFact`](/api/@graphorin/cli/interfaces/MemoryInspectFact.md) \| `null` | - | [packages/cli/src/commands/memory.ts:367](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L367) |
| <a id="property-found"></a> `found` | `readonly` | `boolean` | - | [packages/cli/src/commands/memory.ts:366](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L366) |
| <a id="property-history"></a> `history` | `readonly` | readonly [`MemoryHistoryEntry`](/api/@graphorin/cli/interfaces/MemoryHistoryEntry.md)[] | - | [packages/cli/src/commands/memory.ts:369](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L369) |
| <a id="property-linkedentities"></a> `linkedEntities` | `readonly` | readonly [`MemoryInspectEntity`](/api/@graphorin/cli/interfaces/MemoryInspectEntity.md)[] | Canonical entities this fact links to (P2-1 / migration 016). | [packages/cli/src/commands/memory.ts:373](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L373) |
