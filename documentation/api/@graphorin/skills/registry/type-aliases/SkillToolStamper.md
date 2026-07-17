[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / SkillToolStamper

# Type Alias: SkillToolStamper

```ts
type SkillToolStamper = (tool, metadata) => ResolvedTool;
```

Defined in: [packages/skills/src/registry/index.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L45)

Stamping seam injected by the agent runtime (Phase 12). It turns a skill's
pre-built `Tool` into a fully resolved `ResolvedTool` (trust class + sandbox
tier + source). The skills package keeps no hard dependency on
`@graphorin/tools`; when no stamper is configured, `activate()` surfaces no
tools (the runtime resolves them itself).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`InlineSkillTool`](/api/@graphorin/skills/type-aliases/InlineSkillTool.md) |
| `metadata` | [`SkillMetadata`](/api/@graphorin/skills/interfaces/SkillMetadata.md) |

## Returns

[`ResolvedTool`](/api/@graphorin/core/interfaces/ResolvedTool.md)
