[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryStatusResult

# Interface: MemoryStatusResult

Defined in: [packages/cli/src/commands/memory.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L50)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-counts"></a> `counts` | `readonly` | \{ `episodes`: `number`; `facts`: `number`; `procedures`: `number`; `sessionMessages`: `number`; \} | [packages/cli/src/commands/memory.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L53) |
| `counts.episodes` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L55) |
| `counts.facts` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L54) |
| `counts.procedures` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L57) |
| `counts.sessionMessages` | `readonly` | `number` | [packages/cli/src/commands/memory.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L56) |
| <a id="property-embedders"></a> `embedders` | `readonly` | readonly [`MemoryStatusEmbedder`](/api/@graphorin/cli/interfaces/MemoryStatusEmbedder.md)[] | [packages/cli/src/commands/memory.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L52) |
| <a id="property-storagepath"></a> `storagePath` | `readonly` | `string` | [packages/cli/src/commands/memory.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L51) |
