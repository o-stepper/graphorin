[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelIdentity

# Interface: ChannelIdentity

Defined in: [packages/channels/src/spi.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L34)

The identity triple of a remote conversation. All three segments
are adapter-scoped opaque strings:

 - `channelId` - the adapter instance (`'telegram'`, `'slack-work'`),
 - `accountId` - the bot/account identity on that channel,
 - `peerId` - the remote peer (user, chat, thread).

The triple is a ROUTING SELECTOR, never an authorization token:
peers assert their own identity through the vendor transport, so
authorization decisions belong to the access policy (pairing /
allowlist), not to string comparison on the triple.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-accountid"></a> `accountId` | `readonly` | `string` | [packages/channels/src/spi.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L36) |
| <a id="property-channelid"></a> `channelId` | `readonly` | `string` | [packages/channels/src/spi.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L35) |
| <a id="property-peerid"></a> `peerId` | `readonly` | `string` | [packages/channels/src/spi.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L37) |
