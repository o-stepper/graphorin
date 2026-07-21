[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InduceOptions

# Interface: InduceOptions

Defined in: packages/memory/src/tiers/procedural-memory.ts:70

**`Stable`**

Options for [ProceduralMemory.induce](/api/@graphorin/memory/classes/ProceduralMemory.md#induce).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | Priority of the stored procedure. Default `INDUCED_PRIORITY` (40). | packages/memory/src/tiers/procedural-memory.ts:74 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Sensitivity of the stored procedure. Default `'internal'`. | packages/memory/src/tiers/procedural-memory.ts:72 |
