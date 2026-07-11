[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / TriggersCommonOptions

# Interface: TriggersCommonOptions

Defined in: [packages/cli/src/commands/triggers.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/triggers.ts#L36)

## Stable

## Extends

- `CommonOutputOptions`

## Extended by

- [`TriggersDisableOptions`](/api/@graphorin/cli/interfaces/TriggersDisableOptions.md)
- [`TriggersFireOptions`](/api/@graphorin/cli/interfaces/TriggersFireOptions.md)
- [`TriggersPruneOptions`](/api/@graphorin/cli/interfaces/TriggersPruneOptions.md)
- [`TriggersStatusOptions`](/api/@graphorin/cli/interfaces/TriggersStatusOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | - | [packages/cli/src/commands/triggers.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/triggers.ts#L37) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
