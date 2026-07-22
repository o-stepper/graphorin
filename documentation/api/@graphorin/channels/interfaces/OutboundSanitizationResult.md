[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / OutboundSanitizationResult

# Interface: OutboundSanitizationResult

Defined in: packages/channels/src/outbound.ts:34

**`Stable`**

Result of one outbound sanitization pass.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-modified"></a> `modified` | `readonly` | `boolean` | - | packages/channels/src/outbound.ts:36 |
| <a id="property-reasons"></a> `reasons` | `readonly` | readonly [`OutboundCommentaryReason`](/api/@graphorin/channels/type-aliases/OutboundCommentaryReason.md)[] | Distinct pattern reasons that matched (bounded cardinality). | packages/channels/src/outbound.ts:38 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | packages/channels/src/outbound.ts:35 |
