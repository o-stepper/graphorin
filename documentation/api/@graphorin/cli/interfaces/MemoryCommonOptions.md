[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryCommonOptions

# Interface: MemoryCommonOptions

Defined in: packages/cli/src/commands/memory.ts:38

**`Stable`**

## Extends

- [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md)

## Extended by

- [`MemoryActivityOptions`](/api/@graphorin/cli/interfaces/MemoryActivityOptions.md)
- [`MemoryInspectOptions`](/api/@graphorin/cli/interfaces/MemoryInspectOptions.md)
- [`MemoryMigrateOptions`](/api/@graphorin/cli/interfaces/MemoryMigrateOptions.md)
- [`MemoryPruneHistoryOptions`](/api/@graphorin/cli/interfaces/MemoryPruneHistoryOptions.md)
- [`MemoryReviewOptions`](/api/@graphorin/cli/interfaces/MemoryReviewOptions.md)
- [`MemoryWhyOptions`](/api/@graphorin/cli/interfaces/MemoryWhyOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | - | packages/cli/src/commands/memory.ts:39 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`json`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`print`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
