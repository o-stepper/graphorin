[**Graphorin API reference v0.13.3**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / ActivationRequest

# Interface: ActivationRequest

Defined in: packages/skills/src/registry/index.ts:126

Activation request produced by [SkillRegistry.resolveTrigger](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#resolvetrigger).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activationkind"></a> `activationKind` | `readonly` | `"auto"` \| `"slash-command"` \| `"explicit"` | packages/skills/src/registry/index.ts:128 |
| <a id="property-args"></a> `args?` | `readonly` | `string` | packages/skills/src/registry/index.ts:129 |
| <a id="property-skill"></a> `skill` | `readonly` | [`Skill`](/api/@graphorin/skills/interfaces/Skill.md) | packages/skills/src/registry/index.ts:127 |
