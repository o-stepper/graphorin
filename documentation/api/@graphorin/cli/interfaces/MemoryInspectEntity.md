[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryInspectEntity

# Interface: MemoryInspectEntity

Defined in: packages/cli/src/commands/memory.ts:343

**`Stable`**

A canonical entity a fact links to (migration 016). `name` follows
`merged_into` to the surviving entity, so a merged link shows its canonical.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-entityid"></a> `entityId` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:344 |
| <a id="property-mergedfrom"></a> `mergedFrom` | `readonly` | `string` \| `null` | Set when the linked entity was merged into `entityId`/`name`. | packages/cli/src/commands/memory.ts:348 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:345 |
| <a id="property-role"></a> `role` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:346 |
