[**Graphorin API reference v0.10.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [testkit](/api/@graphorin/channels/testkit/index.md) / LoopbackInboundInput

# Interface: LoopbackInboundInput

Defined in: [packages/channels/src/testkit/loopback-adapter.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L22)

Convenience shape for [LoopbackAdapter.inject](/api/@graphorin/channels/testkit/interfaces/LoopbackAdapter.md#inject).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attachments"></a> `attachments?` | `readonly` | readonly [`ChannelAttachment`](/api/@graphorin/channels/interfaces/ChannelAttachment.md)[] | - | [packages/channels/src/testkit/loopback-adapter.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L28) |
| <a id="property-messageid"></a> `messageId?` | `readonly` | `string` | - | [packages/channels/src/testkit/loopback-adapter.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L26) |
| <a id="property-peerid"></a> `peerId?` | `readonly` | `string` | Default `'peer-1'`. | [packages/channels/src/testkit/loopback-adapter.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L25) |
| <a id="property-replyto"></a> `replyTo?` | `readonly` | \{ `excerpt?`: `string`; `messageId`: `string`; \} | - | [packages/channels/src/testkit/loopback-adapter.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L27) |
| `replyTo.excerpt?` | `readonly` | `string` | Short excerpt of the quoted message, when the vendor supplies one. | [packages/channels/src/spi.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L96) |
| `replyTo.messageId` | `readonly` | `string` | - | [packages/channels/src/spi.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L94) |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | [packages/channels/src/testkit/loopback-adapter.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L23) |
