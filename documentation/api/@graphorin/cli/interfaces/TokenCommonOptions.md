[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / TokenCommonOptions

# Interface: TokenCommonOptions

Defined in: packages/cli/src/commands/token.ts:50

**`Stable`**

## Extends

- [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md)

## Extended by

- [`TokenCreateOptions`](/api/@graphorin/cli/interfaces/TokenCreateOptions.md)
- [`TokenListOptions`](/api/@graphorin/cli/interfaces/TokenListOptions.md)
- [`TokenRekeyOptions`](/api/@graphorin/cli/interfaces/TokenRekeyOptions.md)
- [`TokenRevokeOptions`](/api/@graphorin/cli/interfaces/TokenRevokeOptions.md)
- [`TokenRotateOptions`](/api/@graphorin/cli/interfaces/TokenRotateOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | - | packages/cli/src/commands/token.ts:51 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`json`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`print`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-stdoutprint"></a> `stdoutPrint?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture the raw-token stdout line(s). Raw tokens are the machine-consumable output of `create` / `rotate` / `rekey` (S-14b): they go to stdout while log chatter stays on stderr. | - | packages/cli/src/commands/token.ts:57 |
