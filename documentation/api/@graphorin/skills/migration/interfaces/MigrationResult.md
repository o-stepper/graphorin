[**Graphorin API reference v0.11.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [migration](/api/@graphorin/skills/migration/index.md) / MigrationResult

# Interface: MigrationResult

Defined in: [packages/skills/src/migration/index.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L30)

Result of a single SKILL.md migration.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-changed"></a> `changed` | `readonly` | `boolean` | [packages/skills/src/migration/index.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L35) |
| <a id="property-migratedskillmd"></a> `migratedSkillMd` | `readonly` | `string` | [packages/skills/src/migration/index.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L34) |
| <a id="property-originalskillmd"></a> `originalSkillMd` | `readonly` | `string` | [packages/skills/src/migration/index.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L33) |
| <a id="property-rewrites"></a> `rewrites` | `readonly` | readonly [`MigrationRewrite`](/api/@graphorin/skills/migration/interfaces/MigrationRewrite.md)[] | [packages/skills/src/migration/index.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L32) |
| <a id="property-skillid"></a> `skillId` | `readonly` | `string` | [packages/skills/src/migration/index.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L31) |
