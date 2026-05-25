[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InducedProcedure

# Interface: InducedProcedure

Defined in: packages/memory/src/consolidator/phases/induce.ts:79

A reusable workflow distilled from a successful trajectory.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-steps"></a> `steps` | `readonly` | readonly `string`[] | Ordered, value-abstracted steps (`"search for {product}"`, …). | packages/memory/src/consolidator/phases/induce.ts:83 |
| <a id="property-successcriteria"></a> `successCriteria` | `readonly` | readonly `string`[] | Voyager-style verifiable success criteria for self-verification on reuse. | packages/memory/src/consolidator/phases/induce.ts:87 |
| <a id="property-title"></a> `title` | `readonly` | `string` | Short imperative title / goal of the reusable workflow. | packages/memory/src/consolidator/phases/induce.ts:81 |
| <a id="property-variables"></a> `variables` | `readonly` | readonly `string`[] | Variable names abstracted from concrete values (`"product"`, `"day"`). | packages/memory/src/consolidator/phases/induce.ts:85 |
