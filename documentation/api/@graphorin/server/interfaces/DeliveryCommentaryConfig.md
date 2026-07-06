[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentaryConfig

# Interface: DeliveryCommentaryConfig

Defined in: [packages/server/src/commentary/types.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L117)

Public configuration accepted by the WS / SSE / REST event-
emission sanitizer. Shape mirrors the per-server
`WsConfig.commentarySanitization` field documented in the runtime
spec.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-applytoevents"></a> `applyToEvents?` | `readonly` | readonly `string`[] | Whitelist of `event.type` literals to sanitize. The default covers the user-visible commentary surface (`text.delta` plus the two tool-result variants); operators extend the list as their UI rendering boundary expands. | [packages/server/src/commentary/types.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L125) |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly [`DeliveryCommentaryPattern`](/api/@graphorin/server/interfaces/DeliveryCommentaryPattern.md)[] | - | [packages/server/src/commentary/types.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L126) |
| <a id="property-policy"></a> `policy?` | `readonly` | [`DeliveryCommentaryPolicy`](/api/@graphorin/server/type-aliases/DeliveryCommentaryPolicy.md) | - | [packages/server/src/commentary/types.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L118) |
| <a id="property-sink"></a> `sink?` | `readonly` | [`DeliveryCommentarySink`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md) | - | [packages/server/src/commentary/types.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L129) |
| <a id="property-wrapclose"></a> `wrapClose?` | `readonly` | `string` | - | [packages/server/src/commentary/types.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L128) |
| <a id="property-wrapopen"></a> `wrapOpen?` | `readonly` | `string` | - | [packages/server/src/commentary/types.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L127) |
