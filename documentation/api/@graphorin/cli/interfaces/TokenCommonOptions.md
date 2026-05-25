[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / TokenCommonOptions

# Interface: TokenCommonOptions

Defined in: packages/cli/src/commands/token.ts:48

## Stable

## Extends

- `CommonOutputOptions`

## Extended by

- [`TokenCreateOptions`](/api/@graphorin/cli/interfaces/TokenCreateOptions.md)
- [`TokenListOptions`](/api/@graphorin/cli/interfaces/TokenListOptions.md)
- [`TokenRekeyOptions`](/api/@graphorin/cli/interfaces/TokenRekeyOptions.md)
- [`TokenRevokeOptions`](/api/@graphorin/cli/interfaces/TokenRevokeOptions.md)
- [`TokenRotateOptions`](/api/@graphorin/cli/interfaces/TokenRotateOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | - | packages/cli/src/commands/token.ts:49 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam — capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam — capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | packages/cli/src/internal/output.ts:75 |
