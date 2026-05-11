[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / SetAttributeOptions

# Interface: SetAttributeOptions

Defined in: packages/observability/src/tracer/span.ts:27

Optional metadata accepted by `setAttribute(...)` to declare the
sensitivity of a single attribute. The validator uses the declared
tier when deciding whether to drop the attribute.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | packages/observability/src/tracer/span.ts:28 |
