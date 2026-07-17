[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / InlineSkill

# Interface: InlineSkill

Defined in: [packages/skills/src/types/index.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L115)

Pre-built skill payload accepted by `{ kind: 'inline' }`. Bypasses
the file-system loader; useful for tests and bundled defaults.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-basepath"></a> `basePath?` | `readonly` | `string` | - | [packages/skills/src/types/index.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L117) |
| <a id="property-resources"></a> `resources?` | `readonly` | readonly \{ `content`: `string`; `path`: `string`; \}[] | - | [packages/skills/src/types/index.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L118) |
| <a id="property-skillmd"></a> `skillMd` | `readonly` | `string` | - | [packages/skills/src/types/index.ts:116](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L116) |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`InlineSkillTool`](/api/@graphorin/skills/type-aliases/InlineSkillTool.md)[] | Pre-built `Tool[]` payload. When supplied, the loader exposes these via [Skill.tools](/api/@graphorin/skills/interfaces/Skill.md#tools) so [SkillRegistry.tools](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#tools) returns them deduplicated by `tool.name`. Folder / npm / git sources do not carry tool implementations - the agent runtime (Phase 12) materialises them from the skill's `tools/` directory. The inline source is the only path through which tests + bundled defaults can ship pre-built tools. | [packages/skills/src/types/index.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L129) |
