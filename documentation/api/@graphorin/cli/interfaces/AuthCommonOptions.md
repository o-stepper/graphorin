[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / AuthCommonOptions

# Interface: AuthCommonOptions

Defined in: packages/cli/src/commands/auth.ts:57

**`Stable`**

## Extends

- `CommonOutputOptions`

## Extended by

- [`AuthListOptions`](/api/@graphorin/cli/interfaces/AuthListOptions.md)
- [`AuthLoginOptions`](/api/@graphorin/cli/interfaces/AuthLoginOptions.md)
- [`AuthRefreshOptions`](/api/@graphorin/cli/interfaces/AuthRefreshOptions.md)
- [`AuthRevokeOptions`](/api/@graphorin/cli/interfaces/AuthRevokeOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | - | packages/cli/src/commands/auth.ts:58 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | packages/cli/src/internal/output.ts:75 |
