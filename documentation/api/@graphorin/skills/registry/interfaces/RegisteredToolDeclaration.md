[**Graphorin API reference v0.9.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / RegisteredToolDeclaration

# Interface: RegisteredToolDeclaration

Defined in: [packages/skills/src/registry/index.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L139)

Tool-declaration record exposed by [SkillRegistry.toolDeclarations](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#tooldeclarations).
Adds the owning skill's name and trust level so downstream
registrations into `@graphorin/tools` can stamp the source.

## Stable

## Extends

- [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md).[`description`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md#property-description) | [packages/skills/src/types/index.ts:243](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L243) |
| <a id="property-module"></a> `module?` | `readonly` | `string` | [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md).[`module`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md#property-module) | [packages/skills/src/types/index.ts:242](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L242) |
| <a id="property-name"></a> `name` | `readonly` | `string` | [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md).[`name`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md#property-name) | [packages/skills/src/types/index.ts:241](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L241) |
| <a id="property-skillname"></a> `skillName` | `readonly` | `string` | - | [packages/skills/src/registry/index.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L140) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md).[`tags`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md#property-tags) | [packages/skills/src/types/index.ts:244](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L244) |
| <a id="property-trustlevel"></a> `trustLevel` | `readonly` | [`SkillsTrustLevel`](/api/@graphorin/skills/type-aliases/SkillsTrustLevel.md) | - | [packages/skills/src/registry/index.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L141) |
