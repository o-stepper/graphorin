[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [loader](/api/@graphorin/skills/loader/index.md) / loadSkills

# Function: loadSkills()

```ts
function loadSkills(sources, options?): Promise<readonly Skill[]>;
```

Defined in: packages/skills/src/loader/index.ts:193

Load multiple skills concurrently. Emits a warning diagnostic on
the first encountered source error when
`throwOnSourceError === false`; otherwise the first error
propagates out unchanged.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `sources` | readonly [`SkillSource`](/api/@graphorin/skills/type-aliases/SkillSource.md)[] |
| `options` | [`LoadSkillsOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillsOptions.md) |

## Returns

`Promise`\&lt;readonly [`Skill`](/api/@graphorin/skills/interfaces/Skill.md)[]\&gt;

## Stable
