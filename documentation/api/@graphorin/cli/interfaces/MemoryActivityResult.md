[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryActivityResult

# Interface: MemoryActivityResult

Defined in: packages/cli/src/commands/memory.ts:385

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-quarantine"></a> `quarantine` | `readonly` | \{ `episodes`: `number`; `facts`: `number`; `insights`: `number`; \} | packages/cli/src/commands/memory.ts:386 |
| `quarantine.episodes` | `readonly` | `number` | packages/cli/src/commands/memory.ts:388 |
| `quarantine.facts` | `readonly` | `number` | packages/cli/src/commands/memory.ts:387 |
| `quarantine.insights` | `readonly` | `number` | packages/cli/src/commands/memory.ts:389 |
| <a id="property-recentconflicts"></a> `recentConflicts` | `readonly` | readonly [`MemoryActivityConflict`](/api/@graphorin/cli/interfaces/MemoryActivityConflict.md)[] | packages/cli/src/commands/memory.ts:392 |
| <a id="property-recenthistory"></a> `recentHistory` | `readonly` | readonly [`MemoryActivityEvent`](/api/@graphorin/cli/interfaces/MemoryActivityEvent.md)[] | packages/cli/src/commands/memory.ts:391 |
