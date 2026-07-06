[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / StorageRekeyOptions

# Interface: StorageRekeyOptions

Defined in: packages/cli/src/commands/storage.ts:397

## Stable

## Extends

- [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-config) | packages/cli/src/commands/storage.ts:49 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-newpassphrasefrom"></a> `newPassphraseFrom` | `readonly` | `string` | - | - | packages/cli/src/commands/storage.ts:399 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-oldpassphrasefrom"></a> `oldPassphraseFrom` | `readonly` | `string` | - | - | packages/cli/src/commands/storage.ts:398 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
