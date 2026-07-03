[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryActivityResult

# Interface: MemoryActivityResult

Defined in: packages/cli/src/commands/memory.ts:444

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-quarantine"></a> `quarantine` | `readonly` | \{ `episodes`: `number`; `facts`: `number`; `insights`: `number`; \} | packages/cli/src/commands/memory.ts:445 |
| `quarantine.episodes` | `readonly` | `number` | packages/cli/src/commands/memory.ts:447 |
| `quarantine.facts` | `readonly` | `number` | packages/cli/src/commands/memory.ts:446 |
| `quarantine.insights` | `readonly` | `number` | packages/cli/src/commands/memory.ts:448 |
| <a id="property-recentconflicts"></a> `recentConflicts` | `readonly` | readonly [`MemoryActivityConflict`](/api/@graphorin/cli/interfaces/MemoryActivityConflict.md)[] | packages/cli/src/commands/memory.ts:451 |
| <a id="property-recenthistory"></a> `recentHistory` | `readonly` | readonly [`MemoryActivityEvent`](/api/@graphorin/cli/interfaces/MemoryActivityEvent.md)[] | packages/cli/src/commands/memory.ts:450 |
