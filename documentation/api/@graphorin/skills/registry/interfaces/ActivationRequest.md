[**Graphorin API reference v0.10.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / ActivationRequest

# Interface: ActivationRequest

Defined in: [packages/skills/src/registry/index.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L126)

Activation request produced by [SkillRegistry.resolveTrigger](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#resolvetrigger).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activationkind"></a> `activationKind` | `readonly` | `"auto"` \| `"slash-command"` \| `"explicit"` | [packages/skills/src/registry/index.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L128) |
| <a id="property-args"></a> `args?` | `readonly` | `string` | [packages/skills/src/registry/index.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L129) |
| <a id="property-skill"></a> `skill` | `readonly` | [`Skill`](/api/@graphorin/skills/interfaces/Skill.md) | [packages/skills/src/registry/index.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L127) |
