[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingTraceSpanLike

# Interface: PricingTraceSpanLike

Defined in: [packages/pricing/src/types.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L113)

Span-shape input accepted by [listMissingModels](/api/@graphorin/pricing/functions/listMissingModels.md). Lightweight
subset of `SpanRecord` from `@graphorin/observability` so the
pricing package stays free of an observability dependency.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-attributes"></a> `attributes` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/pricing/src/types.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L114) |
