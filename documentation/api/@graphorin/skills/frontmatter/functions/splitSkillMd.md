[**Graphorin API reference v0.13.8**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / splitSkillMd

# Function: splitSkillMd()

```ts
function splitSkillMd(skillMd): SplitSkillMd;
```

Defined in: packages/skills/src/frontmatter/index.ts:51

**`Stable`**

Split a raw SKILL.md string into the YAML frontmatter and the
markdown body. The frontmatter delimiter is the canonical
`---\n…\n---\n` pair.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `skillMd` | `string` |

## Returns

[`SplitSkillMd`](/api/@graphorin/skills/frontmatter/interfaces/SplitSkillMd.md)
