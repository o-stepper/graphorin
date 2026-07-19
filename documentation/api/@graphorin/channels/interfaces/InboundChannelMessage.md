[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / InboundChannelMessage

# Interface: InboundChannelMessage

Defined in: packages/channels/src/spi.ts:81

**`Stable`**

A normalized inbound message. Produced by the adapter, consumed by
the gateway pipeline (policy -> sanitization -> routing -> handler).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attachments"></a> `attachments?` | `readonly` | readonly [`ChannelAttachment`](/api/@graphorin/channels/interfaces/ChannelAttachment.md)[] | - | packages/channels/src/spi.ts:91 |
| <a id="property-identity"></a> `identity` | `readonly` | [`ChannelIdentity`](/api/@graphorin/channels/interfaces/ChannelIdentity.md) | - | packages/channels/src/spi.ts:82 |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | Channel-native message id (dedup + audit). | packages/channels/src/spi.ts:84 |
| <a id="property-raw"></a> `raw?` | `readonly` | `unknown` | The raw vendor payload, kept for audit only. The gateway never feeds it to a model and never routes on it. | packages/channels/src/spi.ts:104 |
| <a id="property-receivedat"></a> `receivedAt` | `readonly` | `string` | ISO-8601 receive timestamp (adapter clock). | packages/channels/src/spi.ts:99 |
| <a id="property-replyto"></a> `replyTo?` | `readonly` | \{ `excerpt?`: `string`; `messageId`: `string`; \} | Reply context, when the peer replied to an earlier message. | packages/channels/src/spi.ts:93 |
| `replyTo.excerpt?` | `readonly` | `string` | Short excerpt of the quoted message, when the vendor supplies one. | packages/channels/src/spi.ts:96 |
| `replyTo.messageId` | `readonly` | `string` | - | packages/channels/src/spi.ts:94 |
| <a id="property-text"></a> `text` | `readonly` | `string` | Normalized plain text. Empty string for attachment-only messages. UNTRUSTED by definition - the gateway sanitizes it and labels the run's taint ledger before any agent sees it. | packages/channels/src/spi.ts:90 |
