[**Graphorin API reference v0.13.7**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [migration](/api/@graphorin/skills/migration/index.md) / MigrateFrontmatterOptions

# Interface: MigrateFrontmatterOptions

Defined in: packages/skills/src/migration/index.ts:39

Options accepted by [migrateFrontmatter](/api/@graphorin/skills/migration/functions/migrateFrontmatter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-apply"></a> `apply?` | `readonly` | `boolean` | When `true`, rewrites are applied to the returned `migratedSkillMd`. When `false` (default), `migratedSkillMd === originalSkillMd` and the function operates as a dry-run report. | packages/skills/src/migration/index.ts:47 |
| <a id="property-skillid"></a> `skillId?` | `readonly` | `string` | Identifier used in audit / error messages. Defaults to `'<inline>'`. | packages/skills/src/migration/index.ts:41 |
