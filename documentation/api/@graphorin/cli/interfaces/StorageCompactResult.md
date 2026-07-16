[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / StorageCompactResult

# Interface: StorageCompactResult

Defined in: [packages/cli/src/commands/storage.ts:211](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L211)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autovacuum"></a> `autoVacuum` | `readonly` | `number` | Raw `PRAGMA auto_vacuum` value: 0 none, 1 full, 2 incremental. | [packages/cli/src/commands/storage.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L214) |
| <a id="property-freelistafter"></a> `freelistAfter?` | `readonly` | `number` | - | [packages/cli/src/commands/storage.ts:218](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L218) |
| <a id="property-freelistbefore"></a> `freelistBefore?` | `readonly` | `number` | - | [packages/cli/src/commands/storage.ts:217](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L217) |
| <a id="property-pagesize"></a> `pageSize?` | `readonly` | `number` | - | [packages/cli/src/commands/storage.ts:219](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L219) |
| <a id="property-path"></a> `path` | `readonly` | `string` | - | [packages/cli/src/commands/storage.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L212) |
| <a id="property-reclaimedbytes"></a> `reclaimedBytes?` | `readonly` | `number` | `page_size * (freelistBefore - freelistAfter)`. | [packages/cli/src/commands/storage.ts:221](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L221) |
| <a id="property-supported"></a> `supported` | `readonly` | `boolean` | `true` when the database supports incremental compaction. | [packages/cli/src/commands/storage.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L216) |
