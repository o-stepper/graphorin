[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InduceOptions

# Interface: InduceOptions

Defined in: [packages/memory/src/tiers/procedural-memory.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L70)

Options for [ProceduralMemory.induce](/api/@graphorin/memory/classes/ProceduralMemory.md#induce).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | Priority of the stored procedure. Default `INDUCED_PRIORITY` (40). | [packages/memory/src/tiers/procedural-memory.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L74) |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Sensitivity of the stored procedure. Default `'internal'`. | [packages/memory/src/tiers/procedural-memory.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L72) |
