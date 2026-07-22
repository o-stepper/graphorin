[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / StorageBackupOptions

# Interface: StorageBackupOptions

Defined in: packages/cli/src/commands/storage.ts:133

**`Stable`**

## Extends

- [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-config) | packages/cli/src/commands/storage.ts:49 |
| <a id="property-dest"></a> `dest` | `readonly` | `string` | Destination file path for the backup copy. | - | packages/cli/src/commands/storage.ts:135 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-overwrite"></a> `overwrite?` | `readonly` | `boolean` | Replace an existing destination file. Default: refuse. | - | packages/cli/src/commands/storage.ts:137 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
