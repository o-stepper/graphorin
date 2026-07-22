[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / DeliveryReceipt

# Interface: DeliveryReceipt

Defined in: packages/channels/src/spi.ts:175

**`Stable`**

Acknowledgement returned by a successful [ChannelAdapter.deliver](/api/@graphorin/channels/interfaces/ChannelAdapter.md#deliver).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-deliveredat"></a> `deliveredAt` | `readonly` | `string` | ISO-8601 delivery timestamp (adapter clock). | packages/channels/src/spi.ts:179 |
| <a id="property-messageid"></a> `messageId?` | `readonly` | `string` | Channel-native id of the delivered message, when the vendor returns one. | packages/channels/src/spi.ts:177 |
