[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryStatusResult

# Interface: MemoryStatusResult

Defined in: packages/cli/src/commands/memory.ts:54

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-counts"></a> `counts` | `readonly` | \{ `episodes`: `number`; `facts`: `number`; `procedures`: `number`; `sessionMessages`: `number`; \} | packages/cli/src/commands/memory.ts:57 |
| `counts.episodes` | `readonly` | `number` | packages/cli/src/commands/memory.ts:59 |
| `counts.facts` | `readonly` | `number` | packages/cli/src/commands/memory.ts:58 |
| `counts.procedures` | `readonly` | `number` | packages/cli/src/commands/memory.ts:61 |
| `counts.sessionMessages` | `readonly` | `number` | packages/cli/src/commands/memory.ts:60 |
| <a id="property-embedders"></a> `embedders` | `readonly` | readonly [`MemoryStatusEmbedder`](/api/@graphorin/cli/interfaces/MemoryStatusEmbedder.md)[] | packages/cli/src/commands/memory.ts:56 |
| <a id="property-storagepath"></a> `storagePath` | `readonly` | `string` | packages/cli/src/commands/memory.ts:55 |
