[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryInspectOptions

# Interface: MemoryInspectOptions

Defined in: packages/cli/src/commands/memory.ts:259

## Stable

## Extends

- [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-config) | packages/cli/src/commands/memory.ts:35 |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | - | packages/cli/src/commands/memory.ts:260 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
