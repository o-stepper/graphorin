[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / StartSpanOptions

# Interface: StartSpanOptions\<T\>

Defined in: packages/core/src/contracts/tracer.ts:160

Span constructor parameters.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) | [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-attrs"></a> `attrs?` | `readonly` | `Readonly`\<`Record`\<`string`, [`SpanAttributeValue`](/api/@graphorin/core/type-aliases/SpanAttributeValue.md)\>\> | packages/core/src/contracts/tracer.ts:162 |
| <a id="property-parent"></a> `parent?` | `readonly` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\<[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\> | packages/core/src/contracts/tracer.ts:163 |
| <a id="property-type"></a> `type` | `readonly` | `T` | packages/core/src/contracts/tracer.ts:161 |
