[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MigrateExportOptions

# Interface: MigrateExportOptions

Defined in: packages/cli/src/commands/migrate-export.ts:42

**`Stable`**

## Extends

- `CommonOutputOptions`

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-input"></a> `input` | `readonly` | `string` | - | - | packages/cli/src/commands/migrate-export.ts:43 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | packages/cli/src/internal/output.ts:75 |
| <a id="property-to"></a> `to` | `readonly` | `string` | - | - | packages/cli/src/commands/migrate-export.ts:44 |
| <a id="property-toschema"></a> `toSchema?` | `readonly` | `string` | Defaults to the writer's current schema (e.g. `'1.0'`). | - | packages/cli/src/commands/migrate-export.ts:46 |
| <a id="property-writer"></a> `writer?` | `readonly` | `string` | Surfaced on the meta header. Defaults to `graphorin-cli@<version>` (the current package version). | - | packages/cli/src/commands/migrate-export.ts:48 |
