[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SkillMetadataCard

# Interface: SkillMetadataCard

Defined in: packages/memory/src/context-engine/templates/composer.ts:50

**`Stable`**

Render Layer 4 skills metadata cards. Each entry is a
`<skill ... />` self-closing tag so the model sees only the
progressive-disclosure metadata - the full SKILL.md body is
loaded on-demand via `activate_skill(name)` per RB-04.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | packages/memory/src/context-engine/templates/composer.ts:52 |
| <a id="property-disablemodelinvocation"></a> `disableModelInvocation?` | `readonly` | `boolean` | When `true`, the card is excluded from the assembled prompt. | packages/memory/src/context-engine/templates/composer.ts:55 |
| <a id="property-location"></a> `location?` | `readonly` | `string` | - | packages/memory/src/context-engine/templates/composer.ts:53 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/memory/src/context-engine/templates/composer.ts:51 |
