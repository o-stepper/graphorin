[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InducedProcedure

# Interface: InducedProcedure

Defined in: [packages/memory/src/consolidator/phases/induce.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L80)

A reusable workflow distilled from a successful trajectory.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-steps"></a> `steps` | `readonly` | readonly `string`[] | Ordered, value-abstracted steps (`"search for {product}"`, …). | [packages/memory/src/consolidator/phases/induce.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L84) |
| <a id="property-successcriteria"></a> `successCriteria` | `readonly` | readonly `string`[] | Voyager-style verifiable success criteria for self-verification on reuse. | [packages/memory/src/consolidator/phases/induce.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L88) |
| <a id="property-title"></a> `title` | `readonly` | `string` | Short imperative title / goal of the reusable workflow. | [packages/memory/src/consolidator/phases/induce.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L82) |
| <a id="property-variables"></a> `variables` | `readonly` | readonly `string`[] | Variable names abstracted from concrete values (`"product"`, `"day"`). | [packages/memory/src/consolidator/phases/induce.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L86) |
