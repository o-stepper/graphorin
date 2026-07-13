[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / SecretsRefOptions

# Interface: SecretsRefOptions

Defined in: [packages/cli/src/commands/secrets.ts:178](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/secrets.ts#L178)

## Stable

## Extends

- `CommonOutputOptions`

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
| <a id="property-reveal"></a> `reveal?` | `readonly` | `boolean` | - | - | [packages/cli/src/commands/secrets.ts:180](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/secrets.ts#L180) |
| <a id="property-uri"></a> `uri` | `readonly` | `string` | - | - | [packages/cli/src/commands/secrets.ts:179](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/secrets.ts#L179) |
