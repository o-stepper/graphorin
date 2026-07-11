[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / TokenCreateOptions

# Interface: TokenCreateOptions

Defined in: [packages/cli/src/commands/token.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L55)

## Stable

## Extends

- [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-config) | [packages/cli/src/commands/token.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L51) |
| <a id="property-env"></a> `env?` | `readonly` | `"live"` \| `"test"` | - | - | [packages/cli/src/commands/token.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L61) |
| <a id="property-expiresin"></a> `expiresIn?` | `readonly` | `string` | Duration string: `30d`, `12h`, `90m`, `45s`. | - | [packages/cli/src/commands/token.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L60) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-json) | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-jsonprint) | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-label"></a> `label?` | `readonly` | `string` | - | - | [packages/cli/src/commands/token.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L56) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-noninteractive) | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-print) | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly `string`[] | Comma-separated scope list. | - | [packages/cli/src/commands/token.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L58) |
| <a id="property-stdoutprint"></a> `stdoutPrint?` | `readonly` | `PrintSink` | Test seam - capture the raw-token stdout line. | - | [packages/cli/src/commands/token.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L63) |
