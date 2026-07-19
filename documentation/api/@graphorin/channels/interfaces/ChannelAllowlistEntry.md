[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelAllowlistEntry

# Interface: ChannelAllowlistEntry

Defined in: packages/channels/src/access.ts:36

**`Stable`**

One allowlist entry. `accountId` is optional (matches any account
of the channel when omitted); `channelId` and `peerId` are exact.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-accountid"></a> `accountId?` | `readonly` | `string` | packages/channels/src/access.ts:38 |
| <a id="property-channelid"></a> `channelId` | `readonly` | `string` | packages/channels/src/access.ts:37 |
| <a id="property-peerid"></a> `peerId` | `readonly` | `string` | packages/channels/src/access.ts:39 |
