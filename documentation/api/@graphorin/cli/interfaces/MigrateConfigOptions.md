[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MigrateConfigOptions

# Interface: MigrateConfigOptions

Defined in: packages/cli/src/commands/migrate-config.ts:33

**`Stable`**

## Extends

- [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-input"></a> `input` | `readonly` | `string` | - | - | packages/cli/src/commands/migrate-config.ts:34 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`json`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-out"></a> `out?` | `readonly` | `string` | - | - | packages/cli/src/commands/migrate-config.ts:35 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`print`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
