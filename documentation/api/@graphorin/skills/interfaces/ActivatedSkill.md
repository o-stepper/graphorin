[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / ActivatedSkill

# Interface: ActivatedSkill

Defined in: [packages/skills/src/types/index.ts:303](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L303)

Activated skill - what the agent runtime sees after the model (or a
slash command) elects a skill. Carries the loaded body + declared
tools so the runtime can inject them into the conversation.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activatedat"></a> `activatedAt` | `readonly` | `number` | - | [packages/skills/src/types/index.ts:317](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L317) |
| <a id="property-activationkind"></a> `activationKind` | `readonly` | `"auto"` \| `"slash-command"` \| `"explicit"` | - | [packages/skills/src/types/index.ts:316](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L316) |
| <a id="property-body"></a> `body` | `readonly` | `string` | - | [packages/skills/src/types/index.ts:305](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L305) |
| <a id="property-resources"></a> `resources` | `readonly` | readonly [`SkillResource`](/api/@graphorin/skills/interfaces/SkillResource.md)[] | - | [packages/skills/src/types/index.ts:306](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L306) |
| <a id="property-skill"></a> `skill` | `readonly` | [`Skill`](/api/@graphorin/skills/interfaces/Skill.md) | - | [packages/skills/src/types/index.ts:304](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L304) |
| <a id="property-tools"></a> `tools` | `readonly` | readonly [`ResolvedTool`](/api/@graphorin/core/interfaces/ResolvedTool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[] | Tools made available to the model while the skill is active. The agent runtime (Phase 12) is the canonical producer - it resolves the skill's `tools/` directory or the inline-supplied `Tool[]` and feeds each entry through `stampSkillTool(...)` so the resulting `ResolvedTool` carries the right trust class + sandbox tier. | [packages/skills/src/types/index.ts:315](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L315) |
