[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingTraceSpanLike

# Interface: PricingTraceSpanLike

Defined in: pricing/src/types.ts:113

**`Stable`**

Span-shape input accepted by [listMissingModels](/api/@graphorin/pricing/functions/listMissingModels.md). Lightweight
subset of `SpanRecord` from `@graphorin/observability` so the
pricing package stays free of an observability dependency.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-attributes"></a> `attributes` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | pricing/src/types.ts:114 |
