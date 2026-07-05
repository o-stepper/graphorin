[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SlashCommandActivation

# Interface: SlashCommandActivation

Defined in: packages/skills/src/types/index.ts:327

Result of [parseSlashCommand](/api/@graphorin/skills/activation/functions/parseSlashCommand.md). The loader parses
`/skill:<name>` and `/skill:<name> <free-form-args>` into a
structured payload the agent runtime consumes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `string` | packages/skills/src/types/index.ts:329 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/skills/src/types/index.ts:328 |
| <a id="property-raw"></a> `raw` | `readonly` | `string` | packages/skills/src/types/index.ts:330 |
