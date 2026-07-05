[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillToolDeclaration

# Interface: SkillToolDeclaration

Defined in: packages/skills/src/types/index.ts:240

Tool declaration found inside `graphorin-tools:`. The loader only
captures the declarations; the actual `Tool[]` is produced by the
skill author's `tools/*.ts` modules and bridged into the
`@graphorin/tools` registry by the agent runtime in Phase 12.

## Stable

## Extended by

- [`RegisteredToolDeclaration`](/api/@graphorin/skills/registry/interfaces/RegisteredToolDeclaration.md)

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/skills/src/types/index.ts:243 |
| <a id="property-module"></a> `module?` | `readonly` | `string` | packages/skills/src/types/index.ts:242 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/skills/src/types/index.ts:241 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/skills/src/types/index.ts:244 |
