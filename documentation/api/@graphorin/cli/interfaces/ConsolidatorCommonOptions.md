[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ConsolidatorCommonOptions

# Interface: ConsolidatorCommonOptions

Defined in: [packages/cli/src/commands/consolidator.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L47)

## Stable

## Extends

- `CommonOutputOptions`

## Extended by

- [`ConsolidatorDlqClearOptions`](/api/@graphorin/cli/interfaces/ConsolidatorDlqClearOptions.md)
- [`ConsolidatorDlqListOptions`](/api/@graphorin/cli/interfaces/ConsolidatorDlqListOptions.md)
- [`ConsolidatorSetTierOptions`](/api/@graphorin/cli/interfaces/ConsolidatorSetTierOptions.md)
- [`ConsolidatorStopOptions`](/api/@graphorin/cli/interfaces/ConsolidatorStopOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | - | [packages/cli/src/commands/consolidator.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L48) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
