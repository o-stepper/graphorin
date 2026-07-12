[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / DeliveryPayload

# Interface: DeliveryPayload

Defined in: [packages/channels/src/spi.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L161)

An outbound delivery. `text` is expected to be pre-sanitized by the
gateway (outbound commentary catalogue); adapters must not add
model-facing scaffolding of their own.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-identity"></a> `identity` | `readonly` | [`ChannelIdentity`](/api/@graphorin/channels/interfaces/ChannelIdentity.md) | - | [packages/channels/src/spi.ts:162](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L162) |
| <a id="property-question"></a> `question?` | `readonly` | [`DeliveryQuestion`](/api/@graphorin/channels/interfaces/DeliveryQuestion.md) | Optional interactive question (see [DeliveryQuestion](/api/@graphorin/channels/interfaces/DeliveryQuestion.md)). | [packages/channels/src/spi.ts:167](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L167) |
| <a id="property-replyto"></a> `replyTo?` | `readonly` | `string` | Channel-native id of the message this delivery replies to. | [packages/channels/src/spi.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L165) |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | [packages/channels/src/spi.ts:163](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L163) |
