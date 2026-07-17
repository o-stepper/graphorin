[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / StorageCompactOptions

# Interface: StorageCompactOptions

Defined in: [packages/cli/src/commands/storage.ts:201](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L201)

## Stable

## Extends

- [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchpages"></a> `batchPages?` | `readonly` | `number` | Free pages released per `PRAGMA incremental_vacuum(N)` batch. Small batches keep the writer lock short on a huge freelist. **Default** `1000` | - | [packages/cli/src/commands/storage.ts:207](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L207) |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-config) | [packages/cli/src/commands/storage.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L49) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-json) | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-jsonprint) | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-noninteractive) | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`StorageCommonOptions`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/StorageCommonOptions.md#property-print) | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
