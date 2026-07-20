[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryMigrateResult

# Interface: MemoryMigrateResult

Defined in: packages/cli/src/commands/memory.ts:141

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-migrationid"></a> `migrationId` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:142 |
| <a id="property-processed"></a> `processed` | `readonly` | `number` | - | packages/cli/src/commands/memory.ts:144 |
| <a id="property-reclaimedtables"></a> `reclaimedTables` | `readonly` | readonly `string`[] | Vector tables dropped by `--reclaim` (empty without the flag). | packages/cli/src/commands/memory.ts:146 |
| <a id="property-status"></a> `status` | `readonly` | `"committed"` | - | packages/cli/src/commands/memory.ts:143 |
