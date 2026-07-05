[**Graphorin API reference v0.6.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / RegisteredToolDeclaration

# Interface: RegisteredToolDeclaration

Defined in: packages/skills/src/registry/index.ts:139

Tool-declaration record exposed by [SkillRegistry.toolDeclarations](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#tooldeclarations).
Adds the owning skill's name and trust level so downstream
registrations into `@graphorin/tools` can stamp the source.

## Stable

## Extends

- [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md).[`description`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md#property-description) | packages/skills/src/types/index.ts:243 |
| <a id="property-module"></a> `module?` | `readonly` | `string` | [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md).[`module`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md#property-module) | packages/skills/src/types/index.ts:242 |
| <a id="property-name"></a> `name` | `readonly` | `string` | [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md).[`name`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md#property-name) | packages/skills/src/types/index.ts:241 |
| <a id="property-skillname"></a> `skillName` | `readonly` | `string` | - | packages/skills/src/registry/index.ts:140 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md).[`tags`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md#property-tags) | packages/skills/src/types/index.ts:244 |
| <a id="property-trustlevel"></a> `trustLevel` | `readonly` | [`SkillsTrustLevel`](/api/@graphorin/skills/type-aliases/SkillsTrustLevel.md) | - | packages/skills/src/registry/index.ts:141 |
