[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / TokenListOptions

# Interface: TokenListOptions

Defined in: packages/cli/src/commands/token.ts:135

**`Stable`**

## Extends

- [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`config`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-config) | packages/cli/src/commands/token.ts:51 |
| <a id="property-includerevoked"></a> `includeRevoked?` | `readonly` | `boolean` | - | - | packages/cli/src/commands/token.ts:136 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-stdoutprint"></a> `stdoutPrint?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture the raw-token stdout line(s). Raw tokens are the machine-consumable output of `create` / `rotate` / `rekey` (S-14b): they go to stdout while log chatter stays on stderr. | [`TokenCommonOptions`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md).[`stdoutPrint`](/api/@graphorin/cli/interfaces/TokenCommonOptions.md#property-stdoutprint) | packages/cli/src/commands/token.ts:57 |
