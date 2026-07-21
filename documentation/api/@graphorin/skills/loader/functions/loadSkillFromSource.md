[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [loader](/api/@graphorin/skills/loader/index.md) / loadSkillFromSource

# Function: loadSkillFromSource()

```ts
function loadSkillFromSource(source, options?): Promise<Skill>;
```

Defined in: packages/skills/src/loader/index.ts:125

**`Stable`**

Load a single skill from any supported source. The loader runs the
full frontmatter validator and resolves the supply-chain trust
policy so the returned [Skill](/api/@graphorin/skills/interfaces/Skill.md) is ready to be inserted into a
`SkillRegistry`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`SkillSource`](/api/@graphorin/skills/type-aliases/SkillSource.md) |
| `options` | [`LoadSkillOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md) |

## Returns

`Promise`\&lt;[`Skill`](/api/@graphorin/skills/interfaces/Skill.md)\&gt;
