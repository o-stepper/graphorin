[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelGatewayOptions

# Interface: ChannelGatewayOptions

Defined in: [packages/channels/src/gateway.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L105)

Options for [createChannelGateway](/api/@graphorin/channels/functions/createChannelGateway.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-access"></a> `access` | `readonly` | [`ChannelAccessController`](/api/@graphorin/channels/interfaces/ChannelAccessController.md) | - | [packages/channels/src/gateway.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L108) |
| <a id="property-adapters"></a> `adapters` | `readonly` | readonly [`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md)[] | - | [packages/channels/src/gateway.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L106) |
| <a id="property-injectionclassifier"></a> `injectionClassifier?` | `readonly` | [`InjectionClassifier`](/api/@graphorin/tools/interfaces/InjectionClassifier.md) | B4 (D-12): optional pluggable injection classifier consulted on every inbound body after the regex pass. Default off; classifier errors never fail the pipeline (resilience contract). | [packages/channels/src/gateway.ts:123](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L123) |
| <a id="property-onmessage"></a> `onMessage` | `readonly` | [`ChannelInboundHandler`](/api/@graphorin/channels/type-aliases/ChannelInboundHandler.md) | - | [packages/channels/src/gateway.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L109) |
| <a id="property-onunauthorized"></a> `onUnauthorized?` | `readonly` | [`ChannelUnauthorizedHandler`](/api/@graphorin/channels/type-aliases/ChannelUnauthorizedHandler.md) | - | [packages/channels/src/gateway.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L110) |
| <a id="property-outboundpolicy"></a> `outboundPolicy?` | `readonly` | [`OutboundCommentaryPolicy`](/api/@graphorin/channels/type-aliases/OutboundCommentaryPolicy.md) | Outbound scaffolding policy for every delivery. Default `'strip'` (messenger peers have no envelope-collapsing UI). | [packages/channels/src/gateway.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L117) |
| <a id="property-queuelimit"></a> `queueLimit?` | `readonly` | `number` | Bounded inbound queue per adapter. Default 64; overflow sheds with a WARN. | [packages/channels/src/gateway.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L112) |
| <a id="property-router"></a> `router` | `readonly` | [`IdentityRouter`](/api/@graphorin/channels/interfaces/IdentityRouter.md) | - | [packages/channels/src/gateway.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L107) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`line`) => `void` | WARN sink. Default `process.stderr`. | [packages/channels/src/gateway.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L125) |
