[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryActivityResult

# Interface: MemoryActivityResult

Defined in: [packages/cli/src/commands/memory.ts:446](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L446)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-quarantine"></a> `quarantine` | `readonly` | \{ `episodes`: `number`; `facts`: `number`; `insights`: `number`; \} | [packages/cli/src/commands/memory.ts:447](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L447) |
| `quarantine.episodes` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:449](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L449) |
| `quarantine.facts` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:448](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L448) |
| `quarantine.insights` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:450](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L450) |
| <a id="property-recentconflicts"></a> `recentConflicts` | `readonly` | readonly [`MemoryActivityConflict`](/api/@graphorin/cli/interfaces/MemoryActivityConflict.md)[] | [packages/cli/src/commands/memory.ts:453](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L453) |
| <a id="property-recenthistory"></a> `recentHistory` | `readonly` | readonly [`MemoryActivityEvent`](/api/@graphorin/cli/interfaces/MemoryActivityEvent.md)[] | [packages/cli/src/commands/memory.ts:452](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L452) |
