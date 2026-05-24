[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentaryConfig

# Interface: DeliveryCommentaryConfig

Defined in: packages/server/src/commentary/types.ts:117

Public configuration accepted by the WS / SSE / REST event-
emission sanitizer. Shape mirrors the per-server
`WsConfig.commentarySanitization` field documented in the runtime
spec.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-applytoevents"></a> `applyToEvents?` | `readonly` | readonly `string`[] | Whitelist of `event.type` literals to sanitize. The default covers the user-visible commentary surface (`text.delta` plus the two tool-result variants); operators extend the list as their UI rendering boundary expands. | packages/server/src/commentary/types.ts:125 |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly [`DeliveryCommentaryPattern`](/api/@graphorin/server/interfaces/DeliveryCommentaryPattern.md)[] | - | packages/server/src/commentary/types.ts:126 |
| <a id="property-policy"></a> `policy?` | `readonly` | [`DeliveryCommentaryPolicy`](/api/@graphorin/server/type-aliases/DeliveryCommentaryPolicy.md) | - | packages/server/src/commentary/types.ts:118 |
| <a id="property-sink"></a> `sink?` | `readonly` | [`DeliveryCommentarySink`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md) | - | packages/server/src/commentary/types.ts:129 |
| <a id="property-wrapclose"></a> `wrapClose?` | `readonly` | `string` | - | packages/server/src/commentary/types.ts:128 |
| <a id="property-wrapopen"></a> `wrapOpen?` | `readonly` | `string` | - | packages/server/src/commentary/types.ts:127 |
