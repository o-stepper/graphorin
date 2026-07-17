[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / OutboundSanitizationResult

# Interface: OutboundSanitizationResult

Defined in: [packages/channels/src/outbound.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/outbound.ts#L34)

Result of one outbound sanitization pass.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-modified"></a> `modified` | `readonly` | `boolean` | - | [packages/channels/src/outbound.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/outbound.ts#L36) |
| <a id="property-reasons"></a> `reasons` | `readonly` | readonly [`OutboundCommentaryReason`](/api/@graphorin/channels/type-aliases/OutboundCommentaryReason.md)[] | Distinct pattern reasons that matched (bounded cardinality). | [packages/channels/src/outbound.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/outbound.ts#L38) |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | [packages/channels/src/outbound.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/outbound.ts#L35) |
