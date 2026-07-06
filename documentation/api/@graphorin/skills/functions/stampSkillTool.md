[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / stampSkillTool

# Function: stampSkillTool()

```ts
function stampSkillTool<TInput, TOutput, TDeps>(tool, skill): StampedSkillTool<TInput, TOutput, TDeps>;
```

Defined in: packages/skills/src/registry/bridge.ts:53

Stamp a skill-bundled tool with the metadata the
`@graphorin/tools` registry expects:

1. Derive a `ToolSource` of kind `'skill'` carrying the skill's
   name and trust level.
2. Run `resolveSandbox(...)` so the resulting `Tool.sandboxPolicy`
   matches the mandatory tier for untrusted skills (DEC-148).
3. Default the `inboundSanitization` policy to
   `'detect-and-strip-and-wrap'` for untrusted skills when the tool
   author left it unset; trusted skills inherit the operator's
   choice.

The function returns a freshly-frozen `Tool` with the resolved
`sandboxPolicy` and `inboundSanitization` baked in so downstream
registries cannot accidentally re-inherit a relaxed policy.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |
| `TDeps` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<`TInput`, `TOutput`, `TDeps`\> |
| `skill` | `Pick`\<[`Skill`](/api/@graphorin/skills/interfaces/Skill.md), `"metadata"`\> |

## Returns

[`StampedSkillTool`](/api/@graphorin/skills/interfaces/StampedSkillTool.md)\<`TInput`, `TOutput`, `TDeps`\>

## Stable
