[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [migration](/api/@graphorin/skills/migration/index.md) / MigrationRewrite

# Interface: MigrationRewrite

Defined in: [packages/skills/src/migration/index.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L22)

A single rewrite the migrator applied (or would apply in a dry-run).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | [packages/skills/src/migration/index.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L26) |
| <a id="property-fromfield"></a> `fromField` | `readonly` | `string` | [packages/skills/src/migration/index.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L23) |
| <a id="property-reason"></a> `reason` | `readonly` | `"deprecate-graphorin-prefix"` \| `"co-exist-noop"` \| `"graphorin-only-noop"` | [packages/skills/src/migration/index.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L25) |
| <a id="property-tofield"></a> `toField` | `readonly` | `string` | [packages/skills/src/migration/index.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L24) |
