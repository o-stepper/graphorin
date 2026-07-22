[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelRoute

# Interface: ChannelRoute

Defined in: packages/channels/src/router.ts:31

**`Stable`**

One row of the route table. Omitted identity fields match any
value; `agentId` is mandatory. When `sessionKey` is omitted the
router derives a stable per-peer key
`<channelId>:<accountId>:<peerId>` so distinct peers never share a
session by accident; set it explicitly to pool conversations into
one session on purpose.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-accountid"></a> `accountId?` | `readonly` | `string` | packages/channels/src/router.ts:33 |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/channels/src/router.ts:35 |
| <a id="property-channelid"></a> `channelId?` | `readonly` | `string` | packages/channels/src/router.ts:32 |
| <a id="property-peerid"></a> `peerId?` | `readonly` | `string` | packages/channels/src/router.ts:34 |
| <a id="property-sessionkey"></a> `sessionKey?` | `readonly` | `string` | packages/channels/src/router.ts:36 |
