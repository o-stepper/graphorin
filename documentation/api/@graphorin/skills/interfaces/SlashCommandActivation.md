[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SlashCommandActivation

# Interface: SlashCommandActivation

Defined in: [packages/skills/src/types/index.ts:327](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L327)

Result of [parseSlashCommand](/api/@graphorin/skills/activation/functions/parseSlashCommand.md). The loader parses
`/skill:<name>` and `/skill:<name> <free-form-args>` into a
structured payload the agent runtime consumes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `string` | [packages/skills/src/types/index.ts:329](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L329) |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/skills/src/types/index.ts:328](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L328) |
| <a id="property-raw"></a> `raw` | `readonly` | `string` | [packages/skills/src/types/index.ts:330](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L330) |
