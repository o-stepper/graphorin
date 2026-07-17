[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryActivityOptions

# Interface: MemoryActivityOptions

Defined in: [packages/cli/src/commands/memory.ts:587](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L587)

## Stable

## Extends

- [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-config) | [packages/cli/src/commands/memory.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L39) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-json) | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-jsonprint) | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | Cap on the recent-history / recent-conflict rows returned. Default 20. | - | [packages/cli/src/commands/memory.ts:589](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L589) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-noninteractive) | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`MemoryCommonOptions`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/MemoryCommonOptions.md#property-print) | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
