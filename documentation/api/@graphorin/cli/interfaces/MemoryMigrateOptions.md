[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryMigrateOptions

# Interface: MemoryMigrateOptions

Defined in: packages/cli/src/commands/memory.ts:111

## Stable

## Extends

- [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-config) | packages/cli/src/commands/memory.ts:34 |
| <a id="property-embeddersmodule"></a> `embeddersModule?` | `readonly` | `string` | Optional path to a JS / TS module exporting an `embedders` object: `{ <id>: () => EmbedderProvider }`. The CLI imports this module so it can construct the source / target embedder instances the runner needs. Without the module the command exits `2` with a pointer to the documentation. | - | packages/cli/src/commands/memory.ts:122 |
| <a id="property-from"></a> `from` | `readonly` | `string` | - | - | packages/cli/src/commands/memory.ts:112 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam — capture JSON documents instead of writing to stdout. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam — capture human lines instead of writing to stderr. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-strategy"></a> `strategy` | `readonly` | `"lock-on-first"` \| `"auto-migrate"` \| `"multi-active"` | - | - | packages/cli/src/commands/memory.ts:114 |
| <a id="property-to"></a> `to` | `readonly` | `string` | - | - | packages/cli/src/commands/memory.ts:113 |
