[**Graphorin API reference v0.13.7**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [migration](/api/@graphorin/skills/migration/index.md) / migrateFrontmatter

# Function: migrateFrontmatter()

```ts
function migrateFrontmatter(skillMd, options?): MigrationResult;
```

Defined in: packages/skills/src/migration/index.ts:58

**`Stable`**

Migrate the bundled `deprecate-graphorin-prefix` mappings on a
single SKILL.md. The function is idempotent: re-running it on an
already-migrated SKILL.md returns `changed: false` and an empty
`rewrites` array.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `skillMd` | `string` |
| `options` | [`MigrateFrontmatterOptions`](/api/@graphorin/skills/migration/interfaces/MigrateFrontmatterOptions.md) |

## Returns

[`MigrationResult`](/api/@graphorin/skills/migration/interfaces/MigrationResult.md)
