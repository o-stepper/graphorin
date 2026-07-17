[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / InboundChannelMessage

# Interface: InboundChannelMessage

Defined in: [packages/channels/src/spi.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L81)

A normalized inbound message. Produced by the adapter, consumed by
the gateway pipeline (policy -> sanitization -> routing -> handler).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attachments"></a> `attachments?` | `readonly` | readonly [`ChannelAttachment`](/api/@graphorin/channels/interfaces/ChannelAttachment.md)[] | - | [packages/channels/src/spi.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L91) |
| <a id="property-identity"></a> `identity` | `readonly` | [`ChannelIdentity`](/api/@graphorin/channels/interfaces/ChannelIdentity.md) | - | [packages/channels/src/spi.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L82) |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | Channel-native message id (dedup + audit). | [packages/channels/src/spi.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L84) |
| <a id="property-raw"></a> `raw?` | `readonly` | `unknown` | The raw vendor payload, kept for audit only. The gateway never feeds it to a model and never routes on it. | [packages/channels/src/spi.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L104) |
| <a id="property-receivedat"></a> `receivedAt` | `readonly` | `string` | ISO-8601 receive timestamp (adapter clock). | [packages/channels/src/spi.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L99) |
| <a id="property-replyto"></a> `replyTo?` | `readonly` | \{ `excerpt?`: `string`; `messageId`: `string`; \} | Reply context, when the peer replied to an earlier message. | [packages/channels/src/spi.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L93) |
| `replyTo.excerpt?` | `readonly` | `string` | Short excerpt of the quoted message, when the vendor supplies one. | [packages/channels/src/spi.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L96) |
| `replyTo.messageId` | `readonly` | `string` | - | [packages/channels/src/spi.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L94) |
| <a id="property-text"></a> `text` | `readonly` | `string` | Normalized plain text. Empty string for attachment-only messages. UNTRUSTED by definition - the gateway sanitizes it and labels the run's taint ledger before any agent sees it. | [packages/channels/src/spi.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L90) |
