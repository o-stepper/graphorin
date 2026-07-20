[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryActivityResult

# Interface: MemoryActivityResult

Defined in: packages/cli/src/commands/memory.ts:576

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-quarantine"></a> `quarantine` | `readonly` | \{ `episodes`: `number`; `facts`: `number`; `insights`: `number`; \} | packages/cli/src/commands/memory.ts:577 |
| `quarantine.episodes` | `readonly` | `number` | packages/cli/src/commands/memory.ts:579 |
| `quarantine.facts` | `readonly` | `number` | packages/cli/src/commands/memory.ts:578 |
| `quarantine.insights` | `readonly` | `number` | packages/cli/src/commands/memory.ts:580 |
| <a id="property-recentconflicts"></a> `recentConflicts` | `readonly` | readonly [`MemoryActivityConflict`](/api/@graphorin/cli/interfaces/MemoryActivityConflict.md)[] | packages/cli/src/commands/memory.ts:583 |
| <a id="property-recenthistory"></a> `recentHistory` | `readonly` | readonly [`MemoryActivityEvent`](/api/@graphorin/cli/interfaces/MemoryActivityEvent.md)[] | packages/cli/src/commands/memory.ts:582 |
