[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / TriggersStatusOptions

# Interface: TriggersStatusOptions

Defined in: [packages/cli/src/commands/triggers.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/triggers.ts#L72)

## Stable

## Extends

- [`TriggersCommonOptions`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`TriggersCommonOptions`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md#property-config) | [packages/cli/src/commands/triggers.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/triggers.ts#L37) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | - | [packages/cli/src/commands/triggers.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/triggers.ts#L73) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`TriggersCommonOptions`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md#property-json) | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`TriggersCommonOptions`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md#property-jsonprint) | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`TriggersCommonOptions`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md#property-noninteractive) | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`TriggersCommonOptions`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/TriggersCommonOptions.md#property-print) | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
