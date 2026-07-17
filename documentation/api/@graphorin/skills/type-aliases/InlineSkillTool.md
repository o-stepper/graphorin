[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / InlineSkillTool

# Type Alias: InlineSkillTool

```ts
type InlineSkillTool = Tool;
```

Defined in: [packages/skills/src/types/index.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L107)

Pre-built tool record accepted by the inline source. The loader
does not parse the tool - it forwards the record to the agent
runtime which feeds it through `stampSkillTool(...)` before
registering with `@graphorin/tools`.

## Stable
