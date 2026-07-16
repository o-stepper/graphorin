[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryActivityResult

# Interface: MemoryActivityResult

Defined in: [packages/cli/src/commands/memory.ts:564](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L564)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-quarantine"></a> `quarantine` | `readonly` | \{ `episodes`: `number`; `facts`: `number`; `insights`: `number`; \} | [packages/cli/src/commands/memory.ts:565](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L565) |
| `quarantine.episodes` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:567](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L567) |
| `quarantine.facts` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:566](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L566) |
| `quarantine.insights` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:568](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L568) |
| <a id="property-recentconflicts"></a> `recentConflicts` | `readonly` | readonly [`MemoryActivityConflict`](/api/@graphorin/cli/interfaces/MemoryActivityConflict.md)[] | [packages/cli/src/commands/memory.ts:571](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L571) |
| <a id="property-recenthistory"></a> `recentHistory` | `readonly` | readonly [`MemoryActivityEvent`](/api/@graphorin/cli/interfaces/MemoryActivityEvent.md)[] | [packages/cli/src/commands/memory.ts:570](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L570) |
