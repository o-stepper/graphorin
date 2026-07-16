[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / SkillRegistryOptions

# Interface: SkillRegistryOptions

Defined in: [packages/skills/src/registry/index.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L48)

Options accepted by [createSkillRegistry](/api/@graphorin/skills/registry/functions/createSkillRegistry.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activationstrategy"></a> `activationStrategy?` | `readonly` | `"metadata-only"` \| `"eager"` | Default activation behaviour. When `'metadata-only'` (default), `activate(...)` returns the parsed activation request without invoking `Skill.body()`; callers (the agent runtime) then invoke the body resolver themselves so the runtime can attach a span. When `'eager'`, the registry resolves the body before returning, suitable for tests. | [packages/skills/src/registry/index.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L57) |
| <a id="property-stamptool"></a> `stampTool?` | `readonly` | [`SkillToolStamper`](/api/@graphorin/skills/registry/type-aliases/SkillToolStamper.md) | Optional stamping function (RP-11). When supplied, `activate()` runs each skill's pre-built `Tool[]` through it and surfaces the results on [ActivatedSkill.tools](/api/@graphorin/skills/interfaces/ActivatedSkill.md#property-tools). Without it, `activate()` surfaces no tools - the agent runtime resolves and stamps them itself. | [packages/skills/src/registry/index.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L64) |
