[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / splitFrontmatter

# Function: splitFrontmatter()

```ts
function splitFrontmatter(skillMd): SplitFrontmatter;
```

Defined in: packages/security/src/supply-chain/frontmatter.ts:32

**`Stable`**

Split `skillMd` into the YAML frontmatter and the markdown body.
Throws [SkillManifestParseError](/api/@graphorin/security/classes/SkillManifestParseError.md) when no frontmatter block is
present.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `skillMd` | `string` |

## Returns

[`SplitFrontmatter`](/api/@graphorin/security/interfaces/SplitFrontmatter.md)
