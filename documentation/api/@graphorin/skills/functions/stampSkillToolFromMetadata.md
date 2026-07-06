[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / stampSkillToolFromMetadata

# Function: stampSkillToolFromMetadata()

```ts
function stampSkillToolFromMetadata<TInput, TOutput, TDeps>(tool, metadata): StampedSkillTool<TInput, TOutput, TDeps>;
```

Defined in: packages/skills/src/registry/bridge.ts:66

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
| `tool` | [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<`TInput`, `TOutput`, `TDeps`\> |
| `metadata` | [`SkillMetadata`](/api/@graphorin/skills/interfaces/SkillMetadata.md) |

## Returns

[`StampedSkillTool`](/api/@graphorin/skills/interfaces/StampedSkillTool.md)\<`TInput`, `TOutput`, `TDeps`\>

## Stable
