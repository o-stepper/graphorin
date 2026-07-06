[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / StorageCompactResult

# Interface: StorageCompactResult

Defined in: [packages/cli/src/commands/storage.ts:206](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L206)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autovacuum"></a> `autoVacuum` | `readonly` | `number` | Raw `PRAGMA auto_vacuum` value: 0 none, 1 full, 2 incremental. | [packages/cli/src/commands/storage.ts:209](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L209) |
| <a id="property-freelistafter"></a> `freelistAfter?` | `readonly` | `number` | - | [packages/cli/src/commands/storage.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L213) |
| <a id="property-freelistbefore"></a> `freelistBefore?` | `readonly` | `number` | - | [packages/cli/src/commands/storage.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L212) |
| <a id="property-pagesize"></a> `pageSize?` | `readonly` | `number` | - | [packages/cli/src/commands/storage.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L214) |
| <a id="property-path"></a> `path` | `readonly` | `string` | - | [packages/cli/src/commands/storage.ts:207](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L207) |
| <a id="property-reclaimedbytes"></a> `reclaimedBytes?` | `readonly` | `number` | `page_size * (freelistBefore - freelistAfter)`. | [packages/cli/src/commands/storage.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L216) |
| <a id="property-supported"></a> `supported` | `readonly` | `boolean` | `true` when the database supports incremental compaction. | [packages/cli/src/commands/storage.ts:211](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L211) |
