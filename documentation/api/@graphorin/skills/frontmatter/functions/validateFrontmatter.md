[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / validateFrontmatter

# Function: validateFrontmatter()

```ts
function validateFrontmatter(frontmatter, options?): ValidatedFrontmatter;
```

Defined in: packages/skills/src/frontmatter/index.ts:207

Validate a parsed frontmatter against the bundled spec snapshot and
the `graphorin-*` extension catalogue.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `frontmatter` | `Record`\<`string`, `unknown`\> |
| `options` | [`ValidateFrontmatterOptions`](/api/@graphorin/skills/frontmatter/interfaces/ValidateFrontmatterOptions.md) |

## Returns

[`ValidatedFrontmatter`](/api/@graphorin/skills/frontmatter/interfaces/ValidatedFrontmatter.md)

## Stable
