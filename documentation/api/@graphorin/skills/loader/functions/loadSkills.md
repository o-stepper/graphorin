[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [loader](/api/@graphorin/skills/loader/index.md) / loadSkills

# Function: loadSkills()

```ts
function loadSkills(sources, options?): Promise<readonly Skill[]>;
```

Defined in: packages/skills/src/loader/index.ts:195

**`Stable`**

Load multiple skills concurrently. The sources are loaded in parallel and
the returned array preserves input order. When `throwOnSourceError === false`
(default) a failing source is logged and skipped; otherwise the first
rejection propagates out unchanged.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `sources` | readonly [`SkillSource`](/api/@graphorin/skills/type-aliases/SkillSource.md)[] |
| `options` | [`LoadSkillsOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillsOptions.md) |

## Returns

`Promise`\&lt;readonly [`Skill`](/api/@graphorin/skills/interfaces/Skill.md)[]\&gt;
