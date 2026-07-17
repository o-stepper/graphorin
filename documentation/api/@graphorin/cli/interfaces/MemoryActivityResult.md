[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryActivityResult

# Interface: MemoryActivityResult

Defined in: [packages/cli/src/commands/memory.ts:576](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L576)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-quarantine"></a> `quarantine` | `readonly` | \{ `episodes`: `number`; `facts`: `number`; `insights`: `number`; \} | [packages/cli/src/commands/memory.ts:577](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L577) |
| `quarantine.episodes` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:579](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L579) |
| `quarantine.facts` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:578](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L578) |
| `quarantine.insights` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:580](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L580) |
| <a id="property-recentconflicts"></a> `recentConflicts` | `readonly` | readonly [`MemoryActivityConflict`](/api/@graphorin/cli/interfaces/MemoryActivityConflict.md)[] | [packages/cli/src/commands/memory.ts:583](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L583) |
| <a id="property-recenthistory"></a> `recentHistory` | `readonly` | readonly [`MemoryActivityEvent`](/api/@graphorin/cli/interfaces/MemoryActivityEvent.md)[] | [packages/cli/src/commands/memory.ts:582](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L582) |
