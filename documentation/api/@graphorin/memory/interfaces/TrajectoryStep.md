[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / TrajectoryStep

# Interface: TrajectoryStep

Defined in: packages/memory/src/consolidator/phases/induce.ts:53

**`Stable`**

One distilled step of an agent trajectory - model-agnostic, so the
inducer never sees raw provider/tool wire formats.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-detail"></a> `detail?` | `readonly` | `string` | Concrete args / observation rendered to text (the value-abstraction source). | packages/memory/src/consolidator/phases/induce.ts:57 |
| <a id="property-tool"></a> `tool?` | `readonly` | `string` | Tool invoked at this step, when the step was a tool call. | packages/memory/src/consolidator/phases/induce.ts:55 |
