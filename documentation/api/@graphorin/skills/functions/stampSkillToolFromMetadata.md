[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / stampSkillToolFromMetadata

# Function: stampSkillToolFromMetadata()

```ts
function stampSkillToolFromMetadata<TInput, TOutput, TDeps>(tool, metadata): StampedSkillTool<TInput, TOutput, TDeps>;
```

Defined in: [packages/skills/src/registry/bridge.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/bridge.ts#L66)

Lower-level variant accepting a raw [SkillMetadata](/api/@graphorin/skills/interfaces/SkillMetadata.md) so
fixtures and tests do not have to materialise a full [Skill](/api/@graphorin/skills/interfaces/Skill.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |
| `TDeps` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt; |
| `metadata` | [`SkillMetadata`](/api/@graphorin/skills/interfaces/SkillMetadata.md) |

## Returns

[`StampedSkillTool`](/api/@graphorin/skills/interfaces/StampedSkillTool.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt;

## Stable
