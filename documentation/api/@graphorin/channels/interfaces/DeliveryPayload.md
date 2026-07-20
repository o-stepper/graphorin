[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / DeliveryPayload

# Interface: DeliveryPayload

Defined in: packages/channels/src/spi.ts:161

**`Stable`**

An outbound delivery. `text` is expected to be pre-sanitized by the
gateway (outbound commentary catalogue); adapters must not add
model-facing scaffolding of their own.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-identity"></a> `identity` | `readonly` | [`ChannelIdentity`](/api/@graphorin/channels/interfaces/ChannelIdentity.md) | - | packages/channels/src/spi.ts:162 |
| <a id="property-question"></a> `question?` | `readonly` | [`DeliveryQuestion`](/api/@graphorin/channels/interfaces/DeliveryQuestion.md) | Optional interactive question (see [DeliveryQuestion](/api/@graphorin/channels/interfaces/DeliveryQuestion.md)). | packages/channels/src/spi.ts:167 |
| <a id="property-replyto"></a> `replyTo?` | `readonly` | `string` | Channel-native id of the message this delivery replies to. | packages/channels/src/spi.ts:165 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | packages/channels/src/spi.ts:163 |
