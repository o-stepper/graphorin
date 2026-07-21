[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [migration](/api/@graphorin/skills/migration/index.md) / MigrationResult

# Interface: MigrationResult

Defined in: packages/skills/src/migration/index.ts:30

Result of a single SKILL.md migration.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-changed"></a> `changed` | `readonly` | `boolean` | packages/skills/src/migration/index.ts:35 |
| <a id="property-migratedskillmd"></a> `migratedSkillMd` | `readonly` | `string` | packages/skills/src/migration/index.ts:34 |
| <a id="property-originalskillmd"></a> `originalSkillMd` | `readonly` | `string` | packages/skills/src/migration/index.ts:33 |
| <a id="property-rewrites"></a> `rewrites` | `readonly` | readonly [`MigrationRewrite`](/api/@graphorin/skills/migration/interfaces/MigrationRewrite.md)[] | packages/skills/src/migration/index.ts:32 |
| <a id="property-skillid"></a> `skillId` | `readonly` | `string` | packages/skills/src/migration/index.ts:31 |
