[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / ActivationRequest

# Interface: ActivationRequest

Defined in: packages/skills/src/registry/index.ts:103

Activation request produced by [SkillRegistry.resolveTrigger](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#resolvetrigger).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activationkind"></a> `activationKind` | `readonly` | `"auto"` \| `"slash-command"` \| `"explicit"` | packages/skills/src/registry/index.ts:105 |
| <a id="property-args"></a> `args?` | `readonly` | `string` | packages/skills/src/registry/index.ts:106 |
| <a id="property-skill"></a> `skill` | `readonly` | [`Skill`](/api/@graphorin/skills/interfaces/Skill.md) | packages/skills/src/registry/index.ts:104 |
