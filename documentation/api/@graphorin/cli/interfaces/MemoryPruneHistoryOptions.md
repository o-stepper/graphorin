[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryPruneHistoryOptions

# Interface: MemoryPruneHistoryOptions

Defined in: [packages/cli/src/commands/memory.ts:1135](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L1135)

## Stable

## Extends

- [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-config) | [packages/cli/src/commands/memory.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L39) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-json) | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-jsonprint) | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-noninteractive) | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-olderthan"></a> `olderThan` | `readonly` | `string` | Age threshold: a duration (`'30d'`, `'12h'`, `'45m'`, `'30s'`) or an ISO date / `YYYY-MM-DD` strictly in the past. Mandatory - the command is destructive by design and must never default. | - | [packages/cli/src/commands/memory.ts:1141](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L1141) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-print) | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
