[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AddEventOptions

# Interface: AddEventOptions

Defined in: packages/core/src/contracts/tracer.ts:120

**`Stable`**

Sensitivity opts for [AISpan.addEvent](/api/@graphorin/core/interfaces/AISpan.md#addevent). Event attributes
used to be un-taggable, so a default-`'public'` export floor dropped
ALL of them - including `exception.type` from `recordException`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Default tier applied to every attribute of this event. | packages/core/src/contracts/tracer.ts:122 |
| <a id="property-sensitivitybyattribute"></a> `sensitivityByAttribute?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)\&gt;\> | Per-attribute overrides; win over [AddEventOptions.sensitivity](/api/@graphorin/core/interfaces/AddEventOptions.md#property-sensitivity). | packages/core/src/contracts/tracer.ts:124 |
