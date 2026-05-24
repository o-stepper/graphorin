[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / SkillRegistryOptions

# Interface: SkillRegistryOptions

Defined in: packages/skills/src/registry/index.ts:38

Options accepted by [createSkillRegistry](/api/@graphorin/skills/registry/functions/createSkillRegistry.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activationstrategy"></a> `activationStrategy?` | `readonly` | `"metadata-only"` \| `"eager"` | Default activation behaviour. When `'metadata-only'` (default), `activate(...)` returns the parsed activation request without invoking `Skill.body()`; callers (the agent runtime) then invoke the body resolver themselves so the runtime can attach a span. When `'eager'`, the registry resolves the body before returning, suitable for tests. | packages/skills/src/registry/index.ts:47 |
