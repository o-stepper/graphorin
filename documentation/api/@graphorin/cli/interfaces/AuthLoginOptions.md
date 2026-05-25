[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / AuthLoginOptions

# Interface: AuthLoginOptions

Defined in: packages/cli/src/commands/auth.ts:45

## Stable

## Extends

- [`AuthCommonOptions`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-clientid"></a> `clientId?` | `readonly` | `string` | Optional pre-existing client identifier — skips Dynamic Client Registration when supplied. | - | packages/cli/src/commands/auth.ts:54 |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`AuthCommonOptions`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md#property-config) | packages/cli/src/commands/auth.ts:41 |
| <a id="property-deviceflow"></a> `deviceFlow?` | `readonly` | `boolean` | - | - | packages/cli/src/commands/auth.ts:49 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`AuthCommonOptions`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam — capture JSON documents instead of writing to stdout. | [`AuthCommonOptions`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`AuthCommonOptions`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam — capture human lines instead of writing to stderr. | [`AuthCommonOptions`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/AuthCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | - | packages/cli/src/commands/auth.ts:48 |
| <a id="property-serverid"></a> `serverId?` | `readonly` | `string` | - | - | packages/cli/src/commands/auth.ts:47 |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | - | - | packages/cli/src/commands/auth.ts:46 |
