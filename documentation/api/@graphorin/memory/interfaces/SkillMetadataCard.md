[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SkillMetadataCard

# Interface: SkillMetadataCard

Defined in: [packages/memory/src/context-engine/templates/composer.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/templates/composer.ts#L50)

Render Layer 4 skills metadata cards. Each entry is a
`<skill ... />` self-closing tag so the model sees only the
progressive-disclosure metadata - the full SKILL.md body is
loaded on-demand via `activate_skill(name)` per RB-04.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | [packages/memory/src/context-engine/templates/composer.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/templates/composer.ts#L52) |
| <a id="property-disablemodelinvocation"></a> `disableModelInvocation?` | `readonly` | `boolean` | When `true`, the card is excluded from the assembled prompt. | [packages/memory/src/context-engine/templates/composer.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/templates/composer.ts#L55) |
| <a id="property-location"></a> `location?` | `readonly` | `string` | - | [packages/memory/src/context-engine/templates/composer.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/templates/composer.ts#L53) |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | [packages/memory/src/context-engine/templates/composer.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/templates/composer.ts#L51) |
